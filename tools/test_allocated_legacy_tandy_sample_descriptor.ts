import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {createNativeAllocatedSound} from '../lib/game/native-race-sound-device.ts';
import {readOriginalCarSoundResources} from '../lib/game/read-car-sound-resources.ts';
import {readOriginalTandyRaceState,writeOriginalTandyRaceState} from '../lib/game/tandy-race-audio-memory.ts';
import {serviceSuppliedTandySilentRequests} from '../lib/game/supplied-tandy-bios.ts';
import {advanceAllocatedRace,advanceAllocatedRaceProgram,assertAllocatedRaceAudioIdle} from '../lib/game/advance-allocated-race.ts';
import {advanceOriginalNestedHardwareClock} from '../lib/game/hardware-clock-memory.ts';
import {runTandySampleContinuation} from '../lib/game/run-tandy-sample-continuation.ts';
const replay=readFileSync('public/game/replays/CTKFIN.RPL'),source=replay.slice(),d=0x2d1a0,driverSegment=0x39e1;
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine,soundDevice:{kind:'tandy',driverGeneration:'ms-1990',port61:()=>0,interruptCx:()=>0,bios:serviceSuppliedTandySilentRequests}},
  {configuration:Array.from(replay.subarray(0,24)),track:Array.from(replay.subarray(24,0x722)),name:'TDLEGACY',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
 // Synthetic sample-bearing effect only in a disposable allocated-memory copy.
 const memory=runtime.session.state.memory.slice(),view=new DataView(memory.buffer);
 const resource=readOriginalCarSoundResources(memory,d,[view.getUint16(d+0x8016,true)]).find(r=>r.headerSegment!==0)!;assert.ok(resource);
 const instrument=resource.instrumentSegment*16+resource.instrumentOffset;memory.fill(0,instrument,instrument+100);memory[instrument+10]=1;view.setUint16(instrument+12,1,true);view.setUint16(instrument+30,127,true);view.setUint16(instrument+32,127,true);view.setUint16(instrument+36,127,true);
 view.setUint16(instrument+6,0x100,true);view.setUint16(instrument+8,0x7000,true);
 const header=resource.headerSegment*16+resource.headerOffset;view.setUint16(header+12,0x100,true);view.setUint16(header+14,0x6000,true);
 memory.set([0,5,20,1,0xd9],0x60100);view.setUint16(0x70108,6,true);memory.set([128,55,134,217,44,128],0x70132);
 const state=readOriginalTandyRaceState(memory,d,driverSegment,'ms-1990');for(const timer of state.timers)timer.fill(0);for(const voice of state.voices)voice.fill(0);
 const timer=state.timers[16],tv=new DataView(timer.buffer);tv.setUint16(0,0x100,true);tv.setUint16(2,0x6000,true);tv.setUint16(0x1e,resource.instrumentOffset,true);tv.setUint16(0x20,resource.instrumentSegment,true);timer[0x16]=1;timer[0x28]=127;timer[0x22]=127;
 new DataView(state.driver.buffer).setUint16(0x41f+10,600,true);writeOriginalTandyRaceState(memory,d,{...state,driverSegment});
 view.setUint16(d+0x4e0c,0,true);view.setUint16(d+0x4e6a,0,true);memory[d+0x4e03]=0;
 const cooperative=memory.slice(),requests:unknown[]=[],malformed=memory.slice();new DataView(malformed.buffer).setUint16(instrument+8,65535,true);
 const rejected=createNativeAllocatedSound(()=>malformed,d,driverSegment,{kind:'tandy',driverGeneration:'ms-1990',port61:()=>0,interruptCx:()=>0,bios(){assert.fail('Invalid descriptor cannot submit BIOS work');}},physicsEngine),malformedBefore=malformed.slice();
 assert.throws(()=>rejected.tick(),/outside allocated memory/);assert.deepEqual(malformed,malformedBefore,'Invalid sample pointer must not commit partial voice/driver state');
 const audio=createNativeAllocatedSound(()=>memory,d,driverSegment,{kind:'tandy',driverGeneration:'ms-1990',port61:()=>0,interruptCx:()=>0,bios(batch,live){assert.equal(live,memory);requests.push(...batch.map(request=>({...request})));}},physicsEngine);
 const programAudio=createNativeAllocatedSound(()=>cooperative,d,driverSegment,{kind:'tandy',driverGeneration:'ms-1990',port61:()=>0,interruptCx:()=>0,bios(){assert.fail('Program owner must explicitly service returned BIOS work');}},physicsEngine);
 assert.ok('tickProgram' in programAudio);
 const programRequests:unknown[]=[];
 for(let tick=0;tick<4;tick++){
  const writes=audio.tick(),step=programAudio.tickProgram().next();assert.equal(step.done,true);
  assert.deepEqual(step.value.writes,writes);programRequests.push(...step.value.bios.map(request=>({...request})));assert.deepEqual(cooperative,memory);
 }
 assert.deepEqual(programRequests,requests);
 const sample=requests.find((request:any)=>request.es===0x7000) as {ax:number;es:number;bx:number;cx:number;dx:number}|undefined;
 assert.ok(sample,'Legacy allocated sampled note must resolve its header and deliver BIOS work');assert.equal(sample.bx,0x132);assert.equal(sample.cx,6);assert.equal(sample.dx,600);assert.equal(sample.ax>>>8,0x83);
 assert.ok(requests.some((request:any)=>request.es===driverSegment&&request.bx===0x50f&&request.cx===1&&request.dx===1));
 assert.deepEqual(replay,source);
 for(const mode of ['complete','cancel','failure','replace-memory'] as const){
  runtime.session.originalMemory.writeMemory(cooperative.slice());
  runtime.session.skipIntroduction();
  // Restart the disposable note sequence so this test reaches real BIOS work.
  const setupMemory=runtime.session.state.memory;
  const fresh=readOriginalTandyRaceState(setupMemory,d,driverSegment,'ms-1990');
  for(const timer of fresh.timers)timer.fill(0);for(const voice of fresh.voices)voice.fill(0);
  fresh.timers[16].set(timer);writeOriginalTandyRaceState(setupMemory,d,{...fresh,driverSegment});
  const raceAudio=createNativeAllocatedSound(()=>runtime.session.state.memory,d,driverSegment,{kind:'tandy',driverGeneration:'ms-1990',port61:()=>0,interruptCx:()=>0,bios(){assert.fail('Continuation BIOS must be explicitly delivered');}},physicsEngine);
  assert.ok('tickProgram' in raceAudio);
  const controller=new AbortController();let release!:()=>void,held=false;
  const wait=new Promise<void>(resolve=>{release=resolve;});
  const devices={mouse(){return {x:0,y:0,buttons:0};},joystickSteering(){return 0;},controls(){return 0;},keyDown(){return 0;}};
  const caller={entryStackPointer:0xeefe-0x1c,incomingSI:0};
  for(let tick=0;tick<4&&!held;tick++){
   const program=advanceAllocatedRaceProgram(runtime.session,raceAudio,devices,caller,()=>raceAudio.tickProgram(true,true));
   const pending=runTandySampleContinuation(program,{
    write(){},async bios(batch,signal){if(!batch.length)return;assert.equal(signal,controller.signal);held=true;await wait;if(mode==='failure')throw Error('Fixture BIOS failure');},
    async replaceSample(){assert.fail('Legacy BIOS boundary must not use modern sample replacement');},
   },controller.signal);
   if(!held){assert.equal(await pending,true);continue;}
   const live=runtime.session.state.memory,view=new DataView(live.buffer,live.byteOffset,live.byteLength),frame=view.getUint16(d+0x8c26,true),clock=view.getUint32(d+0x407a,true);
   assert.equal(live[d+0x408e],1);
   assert.throws(()=>advanceAllocatedRace(runtime.session,raceAudio,devices,caller),/pending audio continuation/);
   for(let edge=0;edge<5;edge++)advanceOriginalNestedHardwareClock(live,d);
   assert.equal(view.getUint16(d+0x8c26,true),frame,'Held sound work cannot advance captured race frames');
   assert.equal(view.getUint32(d+0x407a,true),clock+5);
   if(mode==='cancel')controller.abort();
   if(mode==='replace-memory')runtime.session.originalMemory.writeMemory(live.slice());
   release();
   if(mode==='failure')await assert.rejects(pending,/Fixture BIOS failure/);
   else if(mode==='replace-memory')await assert.rejects(pending,/memory replaced (during BIOS continuation|while suspended)/);
   else assert.equal(await pending,mode==='complete');
   if(mode!=='complete')assert.equal(view.getUint16(d+0x8c26,true),frame);
   assert.equal(live[d+0x408e],0);assertAllocatedRaceAudioIdle(runtime.session);
  }
  assert.equal(held,true,'Actual allocated legacy note must reach the held BIOS boundary');
 }
 console.log(`${physicsEngine}: allocated race holds captured frames while BIOS delivery waits, retains nested clocks and releases ownership on success/cancellation/failure/memory replacement`);
 const engineMemory=memory.slice(),engineView=new DataView(engineMemory.buffer),engineState=readOriginalTandyRaceState(engineMemory,d,driverSegment,'ms-1990');
 for(const record of engineState.timers)record.fill(0);for(const record of engineState.voices){record.fill(0);record[0]=255;}
 engineState.driver[0x504]=0;engineState.timers[16][0x16]=15;engineState.timers[16][0x23]=16;
 const car=engineState.cars[0];car.fill(0,0,34);car[0]=car[27]=1;const cv=new DataView(car.buffer,car.byteOffset,car.byteLength);
 for(const [at,value] of [[2,16],[18,65535],[20,65535],[22,65535],[0x1c,600],[0x24,resource.instrumentOffset],[0x26,resource.instrumentSegment]])cv.setUint16(at,value,true);
 engineMemory[instrument+14]=1;engineMemory[instrument+16]=0;
 writeOriginalTandyRaceState(engineMemory,d,{...engineState,driverSegment});engineView.setUint16(d+0x4e0c,1,true);engineMemory[d+0x4e05]=1;
 const engineProgramMemory=engineMemory.slice();
 const device={kind:'tandy' as const,driverGeneration:'ms-1990' as const,port61:()=>0,interruptCx:()=>0,bios(){assert.fail('First engine note only stages sample, without BIOS playback');}};
 const engineAudio=createNativeAllocatedSound(()=>engineMemory,d,driverSegment,device,physicsEngine),engineProgramAudio=createNativeAllocatedSound(()=>engineProgramMemory,d,driverSegment,device,physicsEngine);assert.ok('tickProgram' in engineProgramAudio);
 const engineWrites=engineAudio.tick(),engineStep=engineProgramAudio.tickProgram(true,true).next();assert.equal(engineStep.done,true);assert.deepEqual(engineStep.value.writes,engineWrites);assert.deepEqual(engineStep.value.bios,[]);assert.deepEqual(engineProgramMemory,engineMemory);
 const staged=readOriginalTandyRaceState(engineMemory,d,driverSegment,'ms-1990'),dv=new DataView(staged.driver.buffer,staged.driver.byteOffset,staged.driver.byteLength);
 assert.equal(staged.driver[0x504],2);assert.equal(dv.getUint16(0x50a,true),6);assert.equal(dv.getUint16(0x508,true),0x7000);assert.equal(staged.cars[0][1],1);assert.equal(staged.cars[0][27],0);
 console.log(`${physicsEngine}: allocated engine restart resolves live sample descriptor; synchronous/resumable full memory and writes match`);
 console.log(`${physicsEngine}: legacy sampled effect resolves live allocated descriptor and produces identical synchronous/program memory, writes and BIOS requests; BIOS/DMA timing not executed`);
}
