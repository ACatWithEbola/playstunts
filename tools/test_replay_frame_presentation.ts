import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runNativeReplayControls,type NativeReplayControlsHost} from '../lib/game/native-replay-controls.ts';
import {originalRaceKeyCommand} from '../lib/game/race-key-command.ts';
import {selectOriginalReplayControl} from '../lib/game/replay-control-selection.ts';

const d=0x2d1a0;
const baseline=new Uint8Array(readFileSync(new URL('../public/game/native-resource-base.bin',import.meta.url)));
type Sample={key?:number;x?:number;y?:number};
function fixture(visible:boolean,target:0|1=0){
 const memory=baseline.slice(),view=new DataView(memory.buffer);
 memory[d+0xa3c2]=2;memory[d+0x9aca]=0;memory[d+0xaae6]=Number(visible);memory[d+0xa77f]=Number(visible);
 memory[d+0x8fc8]=1;memory[d+0xa9f0]=target;memory[d+0x12f]=2;memory[d+0x31e9]=3;memory[d+0x132]=1;
 selectOriginalReplayControl(memory,d,3);
 view.setUint16(d+0x8c26,100,true);view.setUint16(d+0x8fd8,1000,true);
 const pending:((sample:Sample)=>void)[]=[],controls:number[][]=[],presented:number[]=[];
 let reads=0,raf=0,settled=false;
 const host:NativeReplayControlsHost={
  memory:()=>memory,
  // The real browser read waits for requestAnimationFrame before polling.
  // Keep that boundary explicit and advance it deterministically in the test.
  read(){reads++;return new Promise(resolve=>pending.push(sample=>{
   raf++;view.setUint16(d+0xa77c,sample.x??160,true);view.setUint16(d+0xa7de,sample.y??100,true);resolve(sample.key??0);
  }));},
  ctrlHeld:()=>false,
  raceCommand:key=>originalRaceKeyCommand(memory,d,key,{selectMouse(){},resetMouse(){},initialize(){throw Error('Unexpected replay initialization');}}),
  control(mode,start,current){controls.push([mode,start,current]);if(mode===2)selectOriginalReplayControl(memory,d,start);},
  presentWorld(){presented.push(raf);},
  pauseAudio(){},async scrub(){throw Error('Unexpected replay scrub');},async menu(){throw Error('Unexpected replay menu');},
  seekStart(){throw Error('Unexpected replay seek');},async waitTicks(){throw Error('Unexpected replay wait');},
 };
 return {memory,view,pending,controls,presented,
  get reads(){return reads;},get settled(){return settled;},
  run(){settled=false;const result=runNativeReplayControls(host,d);void result.then(()=>{settled=true;});return result;},
  async frame(sample:Sample={}){
   assert.equal(pending.length,1,'one browser frame must be awaited for this replay poll');
   pending.shift()!(sample);
   // Resolve the controller's nested async race-command call and its caller.
   for(let i=0;i<8;i++)await Promise.resolve();
  },
 };
}

for(const rate of [60,120,240])for(const target of [0,1] as const)await test(`hidden playing replay presents every input RAF at ${rate} Hz, target ${target}`,async()=>{
 const state=fixture(false,target);
 for(let frame=0;frame<rate;frame++){
  state.view.setUint16(d+0x8c26,100+Math.floor(frame*20/rate),true);
  const flow=state.run();await state.frame();
  assert.equal(state.settled,true,'a no-key active replay poll must return to the outer renderer');await flow;
 }
 assert.equal(state.reads,rate);
 assert.deepEqual(state.presented,Array.from({length:rate},(_,i)=>i+1),'the input RAF must not leave every second enhanced frame undrawn');
 assert.equal(state.controls.length,0,'presenting the world must not draw or select a hidden replay control');
 assert.equal(state.memory[d+0xa9f0],target);
 assert.equal(state.memory[d+0x9aca],0);
});

await test('rapid hovering over every hidden replay button neither flashes its panel nor changes selection',async()=>{
 const state=fixture(false);
 const positions=Array.from({length:9},(_,i)=>({
  x:Math.trunc((state.view.getInt16(d+0x3216+i*2,true)+state.view.getInt16(d+0x3228+i*2,true))/2),
  y:Math.trunc((state.view.getInt16(d+0x323a+i*2,true)+state.view.getInt16(d+0x324c+i*2,true))/2),
 }));
 for(let i=0;i<90;i++){
  const flow=state.run();await state.frame(positions[i%positions.length]);
  assert.equal(state.controls.length,0,'invisible pointer targets must not request control(1) redraws');
  assert.equal(state.memory[d+0x31e9],3,'invisible pointer targets must not change the selected replay button');
  assert.equal(state.settled,true,'hovering hidden controls must not trap the loop in replay input');await flow;
 }
 assert.equal(state.presented.length,90);
});

await test('visible replay hover retains original selection and panel redraw behavior',async()=>{
 const state=fixture(true),flow=state.run();
 await state.frame({x:211,y:164});
 assert.equal(state.memory[d+0x31e9],4,'the visible stop control remains a pointer target');
 assert.equal(state.settled,false,'a changed visible selection keeps polling as in the original controller');
 assert.deepEqual(state.controls.map(call=>call[0]),[1,1]);
 await state.frame({x:211,y:164});await flow;
 assert.equal(state.controls.length,3,'the next no-key poll presents the visible replay panel');
 assert.equal(state.presented.length,0,'visible-panel redraws already present the world; do not present it twice');
});

for(const [key,name] of [[116,'opponent toggle'],[114,'replay-panel toggle'],[0x3b00,'cockpit camera']] as const)await test(`hidden replay keeps the ${name} keyboard command`,async()=>{
 const state=fixture(false),flow=state.run();
 await state.frame({key,x:211,y:164});await flow;
 assert.equal(state.memory[d+0x31e9],3,'an invisible button under the pointer must not replace the keyboard action');
 assert.equal(state.controls.length,0);
 if(key===116)assert.equal(state.memory[d+0xa9f0],1);
 if(key===114)assert.equal(state.memory[d+0xa77f],1);
 if(key===0x3b00)assert.equal(state.memory[d+0x12f],0);
});
