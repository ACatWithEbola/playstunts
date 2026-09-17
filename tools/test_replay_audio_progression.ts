import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createNativeReplayRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {createNativeResourceCatalog} from '../lib/game/native-resource-catalog.ts';
import {executeReadyMt32Program} from '../lib/game/ready-mt32-program.ts';
import {createBrowserMt32RaceAudio} from '../lib/game/browser-mt32-race-audio.ts';
import {runNativeReplayControls,type NativeReplayControlsHost} from '../lib/game/native-replay-controls.ts';
import {selectOriginalReplayControl} from '../lib/game/replay-control-selection.ts';

const root=new URL('../public/game/',import.meta.url),json=(name:string)=>JSON.parse(readFileSync(new URL(name+'.json',root),'utf8'));
const assets=json('assets'),catalog=createNativeResourceCatalog(json('original-resources/manifest').files,async file=>new Uint8Array(readFileSync(new URL('original-resources/'+file,root))));
const data={base:new Uint8Array(readFileSync(new URL('native-resource-base.bin',root))),catalog,cars:assets.cars,
 records:json('route-records'),vectors:json('route-vectors'),samples:json('route-sample-vectors'),objects:json('track-objects'),
 points:json('route-point-vectors'),indices:json('route-speed-indices'),planes:json('collision-planes'),walls:json('collision-walls').walls,
 soundDevice:{kind:'mt32' as const,execute:executeReadyMt32Program}};
const replaySource=process.argv[2]??new URL('replays/DEFAULT.RPL',root);
const bytes=new Uint8Array(readFileSync(replaySource)),d=0x2d1a0;
const devices={mouse:()=>({x:160,y:100,buttons:0}),joystickSteering:()=>0,controls:()=>0,keyDown:()=>0};
type Target={handle:number;rpm:number;previous:number[];current:number[];interval:number};

async function trace(rate:number,visible:boolean,transition=false){
 const runtime=await createNativeReplayRaceRuntime(data,{configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'DEFAULT',camera:2,graphics:2,soundEnabled:true},
  {bytes,name:'DEFAULT',path:''},{resetMouse(){},async key(){return 27;}});
 // Start in active normal-speed playback after a deterministic seek. The
 // controller, not the rendering loop, owns pause/exit/selection state.
 runtime.session.seek(100);
 const memory=()=>runtime.session.state.memory,word=(at:number)=>{const m=memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(d+at,true);};
 let m=memory();m[d+0x9aca]=Number(transition);m[d+0x8ff4]=0;m[d+0x8ffe]=0;m[d+0xa77f]=Number(transition||visible);m[d+0xaae6]=Number(transition||visible);m[d+0x132]=0;
 selectOriginalReplayControl(m,d,3);
 m[d+0x31e9]=3;
 const targets:Target[]=[],writes:number[][]=[];
 const update=runtime.audio.update;
 runtime.audio.update=(handle,rpm,previous,current,interval)=>{targets.push({handle,rpm,previous:[...previous],current:[...current],interval});update(handle,rpm,previous,current,interval);};
 // Use the production browser buffer scheduler, IRQ stream and allocated MT15
 // driver. Only the physical Web Audio output/synthesizer is replaced: these
 // tests verify changing source RPM and emitted MIDI, not audible synthesis.
 const context={state:'running',currentTime:0,destination:{},
  createGain:()=>({gain:{value:1},connect(){},disconnect(){}}),
  createBuffer:(_channels:number,frames:number)=>({getChannelData:()=>new Float32Array(frames)}),
  createBufferSource:()=>({buffer:null,onended:null,connect(){},disconnect(){},start(){},stop(){}}),
 };
 const audio=createBrowserMt32RaceAudio(context as unknown as AudioContext,{sampleRate:32000,write:values=>writes.push(...values),render:frames=>new Float32Array(frames*2)},[],()=>runtime.tick(devices));
 let reads=0,presents=0,controls=0,nextKey=0;
 const host:NativeReplayControlsHost={memory,
  async read(){context.currentTime=++reads/rate;audio.pump();const key=nextKey;nextKey=0;return key;},
  ctrlHeld:()=>false,raceCommand:key=>{if(key===13)return 0;throw Error('Unexpected command');},
  control(mode,start){if(mode===1)controls++;else if(mode===2)selectOriginalReplayControl(memory(),d,start);else throw Error('Unexpected replay control mode');},presentWorld(){presents++;},
  pauseAudio(){throw Error('Playing replay must not pause audio');},async scrub(){throw Error('Unexpected scrub');},
  async menu(){throw Error('Unexpected menu');},seekStart(){throw Error('Unexpected seek');},async waitTicks(){throw Error('Unexpected wait');},
 };
 try{
  audio.pump();
  if(transition){
   audio.write(runtime.audio.produce());
   nextKey=13;await runNativeReplayControls(host,d);
   assert.equal(memory()[d+0x9aca],0,'Play must leave the paused replay state');
   m=memory();m[d+0xa77f]=Number(visible);m[d+0xaae6]=Number(visible);
  }
  const begin={reads,presents,controls,targets:targets.length,writes:writes.length};
  // Deliberately do not call renderCockpitWorld/onFrame. The actual browser
  // input wait must keep engine audio advancing even inside replay controls.
  for(let frame=0;frame<rate*2;frame++)await runNativeReplayControls(host,d);
  m=memory();
  assert.equal(reads-begin.reads,rate*2);
  assert.equal(presents-begin.presents,visible?0:rate*2);
  assert.equal(controls-begin.controls,visible?rate*2:0);
  assert.equal(m[d+0x9aca],0);
  assert.ok(word(0x8c26)>=140,'actual replay simulation advances at its source rate');
  const activeTargets=targets.slice(begin.targets),activeWrites=writes.slice(begin.writes);
  assert.ok(new Set(activeTargets.map(target=>target.rpm)).size>30,'the driver receives changing engine RPM, not a repeated idle target');
  assert.ok(activeTargets.every(target=>target.rpm>7000),'the moving recorded car retains its actual non-idle RPM');
  assert.ok(activeWrites.some(([port,value])=>port===0x330&&(value&0xf0)===0xe0),'MT15 emits actual pitch-bend MIDI');
  return {targets:activeTargets,writes:activeWrites,frame:word(0x8c26)};
 }finally{audio.close();}
}

const baseline=await trace(60,false);
for(const rate of [60,120,240])for(const visible of [false,true])await test(`MT-32 replay RPM and MIDI keep advancing with ${visible?'visible':'hidden'} controls at ${rate} Hz`,async()=>{
 const result=rate===60&&!visible?baseline:await trace(rate,visible);
 assert.deepEqual(result,baseline,'panel visibility and browser refresh must not change source RPM, MIDI output or replay timing');
});

await test('MT-32 solo replay resumes changing RPM and pitch after the actual paused-to-Play control path',async()=>{
 await trace(120,false,true);
});
