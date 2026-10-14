import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {loadAllocatedReplay} from '../lib/game/allocated-replay-load.ts';
import {readOriginalTandyRaceState} from '../lib/game/tandy-race-audio-memory.ts';
import {serviceSuppliedTandySilentRequests} from '../lib/game/supplied-tandy-bios.ts';
import {tandyDriverLayout} from '../lib/game/tandy-driver-layout.ts';
import {createAllocatedTandyRaceAudio} from '../lib/game/allocated-tandy-race-audio.ts';
import {createNativeAllocatedSound} from '../lib/game/native-race-sound-device.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL'),original=bytes.slice();
for(const driverGeneration of ['ms-1990','ms-1991'] as const){
 const data={...fixtureData,physicsEngine:'ms-1991' as const,soundDevice:{kind:'tandy' as const,driverGeneration,port61:()=>0,interruptCx:()=>0,bios(requests:Parameters<typeof serviceSuppliedTandySilentRequests>[0],memory:Uint8Array){if(driverGeneration==='ms-1991')assert.equal(requests.length,0);else serviceSuppliedTandySilentRequests(requests,memory);}}};
 let runtime=await createNativeManualRaceRuntime(data,{configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'TDGEN',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
 assert.ok(runtime.initialWrites.length>0);
 for(const replayEngine of ['ms-1990','ms-1991'] as const){
  const replacement=await loadAllocatedReplay(data,runtime,{async selectReplay(){return 1;},async readReplay(){return bytes.slice();},replayPhysicsEngine:()=>replayEngine,replayFramesPerSecond:()=>20,showWaiting(){},progress(){},writeAudio(){}});assert.ok(replacement);runtime=replacement;
  runtime.audio.produce();for(let i=0;i<100;i++)runtime.audio.tick();runtime.renderCockpitWorld();
  assert.equal(runtime.session.physicsEngine,replayEngine);
  const state=readOriginalTandyRaceState(runtime.session.state.memory,0x2d1a0,0x39e1,driverGeneration);
  assert.equal(state.driver.length,tandyDriverLayout(driverGeneration).bytes);assert.equal(state.driverGeneration,driverGeneration);assert.deepEqual(bytes,original);
 }
 const memory=runtime.session.state.memory,d=0x2d1a0,v=new DataView(memory.buffer);
 const audio=createAllocatedTandyRaceAudio(()=>memory,d,0x39e1,()=>0,()=>{throw Error('Injected IRQ register failure');},driverGeneration,runtime.session.physicsEngine,'deferred');
 assert.deepEqual(audio.takeSampleStartRequests(),[]);
 v.setUint16(d+0x4e6a,0,true);v.setUint16(d+0x4e0c,0,true);
 assert.throws(()=>audio.tick(),/IRQ register failure/);
 assert.equal(v.getUint16(d+0x4e6a,true),0,'Failed effects must release the original reentry guard');
 assert.deepEqual(audio.takeSampleStartRequests(),[],'Failed ticks cannot publish sample-start work');
 assert.throws(()=>audio.tickProgram().next(),/IRQ register failure/);
 assert.equal(v.getUint16(d+0x4e6a,true),0,'Failed cooperative tick releases reentry guard');
 const fullDevice={kind:'tandy' as const,driverGeneration,port61:()=>0,interruptCx:()=>0,bios(){},sampleStarts(){assert.fail('Tone banks must not manufacture sampled playback');}};
 if(driverGeneration==='ms-1991')createNativeAllocatedSound(()=>memory,d,0x39e1,fullDevice,runtime.session.physicsEngine).tick();
 else assert.throws(()=>createNativeAllocatedSound(()=>memory,d,0x39e1,fullDevice,runtime.session.physicsEngine),/modern full host/);
 const left=memory.slice(),right=memory.slice();
 const synchronous=createAllocatedTandyRaceAudio(()=>left,d,0x39e1,()=>0,()=>0,driverGeneration,runtime.session.physicsEngine);
 const cooperative=createAllocatedTandyRaceAudio(()=>right,d,0x39e1,()=>0,()=>0,driverGeneration,runtime.session.physicsEngine);
 for(let tick=0;tick<20;tick++){
  const writes=synchronous.tick(),program=cooperative.tickProgram(),finished=program.next();assert.equal(finished.done,true);
  if(!finished.done)throw Error('Built-in tone banks unexpectedly require sampled continuation');
  assert.deepEqual(finished.value.writes,writes);assert.deepEqual(finished.value.bios,synchronous.takeBiosRequests());assert.deepEqual(right,left);
 }
 // Continuation must preserve independently gated callbacks, not only normal ticks.
 for(const gate of ['disabled','stopped','reentrant','stack-mismatch'] as const){
  const regularMemory=memory.slice(),programMemory=memory.slice();
  for(const candidate of [regularMemory,programMemory]){
   const words=new DataView(candidate.buffer);
   if(gate==='disabled'){words.setUint16(d+0x4ddc,0,true);words.setUint16(d+0x4dde,0,true);}
   if(gate==='stopped')words.setUint16(d+0x4e0c,1,true);
   if(gate==='reentrant')words.setUint16(d+0x4e6a,1,true);
  }
  const regular=createAllocatedTandyRaceAudio(()=>regularMemory,d,0x39e1,()=>0,()=>0,driverGeneration,runtime.session.physicsEngine);
  const continuation=createAllocatedTandyRaceAudio(()=>programMemory,d,0x39e1,()=>0,()=>0,driverGeneration,runtime.session.physicsEngine);
  const writes=regular.tick(gate!=='stack-mismatch'),finished=continuation.tickProgram(gate!=='stack-mismatch').next();
  assert.equal(finished.done,true,gate);
  if(!finished.done)throw Error('Tone-only gated callback unexpectedly suspended');
  assert.deepEqual(finished.value.writes,writes,gate);assert.deepEqual(finished.value.bios,regular.takeBiosRequests(),gate);
  assert.deepEqual(programMemory,regularMemory,`${driverGeneration}: ${gate} full-memory parity`);
 }
}
console.log('Both Tandy boot generations survive both replay-physics replacements; allocated startup,full driver retention,400 callbacks and rendering pass without modifying source replay');
