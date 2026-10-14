import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,isAbsolute,basename} from 'node:path';
import {fixtureData} from './global-score-fixture.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
const root=process.argv[2];if(!root)throw Error('Provide the complete four-reference competition directory');
const cameras=(process.env.MS91_CORPUS_CAMERAS??'0').split(',').map(Number);
assert.ok(cameras.length&&cameras.length<=4&&new Set(cameras).size===cameras.length&&cameras.every(camera=>Number.isInteger(camera)&&camera>=0&&camera<=3),'Camera corpus must contain distinct original views0..3');
const paths=[...['zct300/25-MAR.RPL','zct300/18-ERI.RPL','zct299/01-ARG.RPL','zct299/20-STB.RPL'].map(name=>({name,path:join(root,name)})),...process.argv.slice(3).map(path=>{assert.ok(isAbsolute(path),'Additional actual recordings require absolute paths');return {name:basename(path),path};})];
const references=paths.map(({name,path})=>{const source=readFileSync(path);return {name,path,source,...decodeVersionedReplay(source,'ms-1991')};});
const baseline=fixtureData.base.slice();
for(const reference of references)for(const slow of [false,true])for(const camera of cameras){
 const {bytes,framesPerSecond}=reference,menu={configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'CORPUS',camera,graphics:2,soundEnabled:false};
 const data={...fixtureData,physicsEngine:'ms-1991' as const,framesPerSecond,...(framesPerSecond===10?{experimental10Hz:true}:{})};
 const control=await createNativeManualRaceRuntime(data,menu,{resetMouse(){}}),modern=await createNativeManualRaceRuntime({...data,experimentalMs91SlowVideoManagement:slow},menu,{resetMouse(){}});
 for(const runtime of [control,modern]){runtime.session.skipIntroduction();runtime.enableGraphicsCapture();}
 const ticks=bytes[22]|bytes[23]<<8;assert.equal(bytes.length,0x722+ticks);let samples=0,calls=0;
 for(let tick=0;tick<=ticks;tick++){
  if(tick===500||tick===1000){
   const snapshot=modern.session.state.memory.slice();
   modern.setMs91VideoManagement(tick===500?!slow:slow);
   assert.deepEqual(modern.session.state.memory,snapshot,'Mid-race video switch cannot change live state');
   // Align the control's full redraw with the target's detached-history reset.
   // Subsequent samples exercise ordinary retained frames again.
   for(const runtime of [control,modern])runtime.session.state.memory[0x2d1a0+0x9ab6]=1;
  }
  if(tick)for(const runtime of [control,modern]){
   const memory=runtime.session.state.memory,result=captureOriginalRaceInput(memory,0x2d1a0,bytes[0x722+tick-1],framesPerSecond,'ms-1991');assert.equal(result.recorded,true);
   runtime.session.originalMemory.writeMemory(memory);runtime.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});
  }
  if(tick===0||tick===1||tick%100===0||tick===ticks){
   const expected=control.renderCockpitWorld().slice(),actual=modern.renderCockpitWorld().slice(),difference=actual.findIndex((n,i)=>n!==expected[i]);
   assert.equal(difference,-1,`${reference.name} slow${slow} tick${tick}: first pixel difference at${difference%320},${Math.floor(difference/320)}`);
   const a=modern.graphicsFrame()!,b=control.graphicsFrame()!;assert.ok(a&&b);
   assert.ok(JSON.stringify(a.calls)===JSON.stringify(b.calls),'Enhanced draw calls at tick'+tick);assert.ok(JSON.stringify(a.wheels)===JSON.stringify(b.wheels),'Enhanced wheels at tick'+tick);
   assert.ok(Buffer.from(a.mask).equals(Buffer.from(b.mask)),'Enhanced overlay mask at tick'+tick);
   assert.ok(Buffer.from(modern.session.state.memory).equals(Buffer.from(control.session.state.memory)),'Rendering must preserve matching simulation state at tick'+tick);
   samples++;calls+=a.calls.length;
  }
 }
 for(const runtime of [control,modern])assert.equal(runtime.session.state.player.driving.car.grip.crash,3,'Reference must reach finish');
 assert.ok(calls>0);assert.deepEqual(readFileSync(reference.path),reference.source);assert.deepEqual(fixtureData.base,baseline);
 console.log(`${reference.name} slow${slow} camera${camera}: real manual runtime matches pixels/enhanced calls/wheels/masks/state across${samples} samples through${ticks} ticks and finish`);
}
