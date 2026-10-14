import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {createNativeAllocatedSound} from '../lib/game/native-race-sound-device.ts';
import {readOriginalCarSoundResources} from '../lib/game/read-car-sound-resources.ts';
import {readOriginalTandyRaceState,writeOriginalTandyRaceState} from '../lib/game/tandy-race-audio-memory.ts';
import {createMs91TandyRaceBinding} from '../lib/game/ms91-tandy-race-binding.ts';
import {controlAllocatedTandyDialogAudio} from '../lib/game/allocated-tandy-dialog-audio.ts';
import {createAllocatedTandyRaceAudio} from '../lib/game/allocated-tandy-race-audio.ts';
import {createMs91TandySampleHost} from '../lib/game/ms91-tandy-sample-host.ts';
import {createMs91TandySampleReplacement} from '../lib/game/ms91-tandy-sample-replacement.ts';
import {createTandySampleContinuationPump} from '../lib/game/tandy-sample-continuation-pump.ts';
import {advanceAllocatedRaceProgram,assertAllocatedRaceAudioIdle} from '../lib/game/advance-allocated-race.ts';
import {startMs91TandySample} from '../lib/game/ms91-tandy-sample-start.ts';
import {advanceOriginalNestedHardwareClock} from '../lib/game/hardware-clock-memory.ts';
const replay=readFileSync('public/game/replays/CTKFIN.RPL'),original=replay.slice();
const runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine:'ms-1991',soundDevice:{kind:'tandy',driverGeneration:'ms-1991',port61:()=>0,interruptCx:()=>0,bios(){assert.fail('Modern driver does not use BIOS samples');}}},
 {configuration:Array.from(replay.subarray(0,24)),track:Array.from(replay.subarray(24,0x722)),name:'TDSample',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
async function run(differential:boolean,blocks:number[],activePause=false,continuation:'resume'|'cancel'|'replaced'|'pump'|'pump-cancel'|'race-pump'|'race-pump-cancel'|'race-mixed'|'coordinated'|'coordinated-cancel'|'coordinated-failure'|undefined=undefined,physicsEngine:'ms-1990'|'ms-1991'='ms-1991',sampleRate=48000){
 const fullRace=!!continuation?.startsWith('race-');
 const activeRuntime=fullRace?await createNativeManualRaceRuntime({...fixtureData,physicsEngine,soundDevice:{kind:'tandy',driverGeneration:'ms-1991',port61:()=>0,interruptCx:()=>0,bios(){}}},{configuration:Array.from(replay.subarray(0,24)),track:Array.from(replay.subarray(24,0x722)),name:'TDRaceSample',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}}):runtime;
 if(fullRace)activeRuntime.session.skipIntroduction();
 // Modify only a disposable copy of the actual allocated fixture, never assets
 // or the original session. Synthetic bank addresses are explicit test inputs.
 const memory=activeRuntime.session.state.memory.slice(),d=0x2d1a0,v=new DataView(memory.buffer),segment=0x39e1;
 const resource=readOriginalCarSoundResources(memory,d,[v.getUint16(d+0x8016,true)]).find(r=>r.headerSegment!==0)!;
 assert.ok(resource);
 const instrumentAddress=resource.instrumentSegment*16+resource.instrumentOffset;
 if(!activePause)memory.fill(0,instrumentAddress,instrumentAddress+100);memory[instrumentAddress+10]=1;
 memory[instrumentAddress+5]=differential?6:0;
 memory[instrumentAddress+16]=0;
 v.setUint16(instrumentAddress+6,0x100,true);v.setUint16(instrumentAddress+8,0x7000,true);v.setUint16(instrumentAddress+12,1,true);
 const header=resource.headerSegment*16+resource.headerOffset;
 v.setUint16(header+12,0x100,true);v.setUint16(header+14,0x6000,true);
 memory.set([0,5,20,1,0xd9],0x60100);memory[0x70104]=differential?6:0;
 if(activePause)memory.set([0,5,0xce,0x10,0x87,0x68,0xd9],0x60100);
 v.setUint16(0x70108,6,true);memory.set([128,55,134,217,44,128],0x70132);
 if(activePause){v.setUint16(0x70108,4000,true);memory.fill(differential?0x37:192,0x70132,0x70132+4000);memory[0x70132]=128;}
 const state=readOriginalTandyRaceState(memory,d,segment,'ms-1991');
 for(const timer of state.timers)timer.fill(0);for(const voice of state.voices)voice.fill(0);
 const timer=state.timers[16],tv=new DataView(timer.buffer,timer.byteOffset,timer.byteLength);
 tv.setUint16(0,0x100,true);tv.setUint16(2,0x6000,true);tv.setUint16(0x1e,resource.instrumentOffset,true);tv.setUint16(0x20,resource.instrumentSegment,true);timer[0x16]=1;
 if(activePause)timer[0x28]=127;
 new DataView(state.driver.buffer,state.driver.byteOffset,state.driver.byteLength).setUint16(0x32f+10,8000,true);
 writeOriginalTandyRaceState(memory,d,{...state,driverSegment:segment});
 v.setUint16(d+0x4e0c,0,true);v.setUint16(d+0x4e6a,0,true);memory[d+0x4e03]=0;memory[d+0x4e05]=Number(activePause);
 if(continuation==='race-mixed'){
  activeRuntime.session.originalMemory.writeMemory(memory);
  const liveMemory=()=>activeRuntime.session.state.memory;
  let binding:ReturnType<typeof createMs91TandyRaceBinding>|undefined;
  const native=createNativeAllocatedSound(liveMemory,d,segment,{kind:'tandy',driverGeneration:'ms-1991',port61:()=>binding?.port61??0,interruptCx:()=>0,bios(){assert.fail('Unexpected BIOS');},sampleStarts(){assert.fail('Mixed race must deliver samples through continuation');}},physicsEngine);
  assert.ok('tickProgram' in native);
  let elapsed=0;const bus:number[][]=[];
  binding=createMs91TandyRaceBinding(segment,{sampleRate,picMask:0,interruptsEnabled:()=>true,
   initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,
   tone:{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1},sampleGain:0.5,busWrite(port,value,position){bus.push([port,value,elapsed+position]);}});
  const devices={mouse:()=>({x:160,y:100,buttons:0}),joystickSteering:()=>0,controls:()=>1,keyDown:()=>0};
  binding.attach(liveMemory,()=>{assert.fail('Cannot mix synchronous and continuation race ticks');},()=>advanceAllocatedRaceProgram(activeRuntime.session,native,devices,{entryStackPointer:0xeefe-0x1c,incomingSI:0},()=>native.tickProgram()),()=>{advanceOriginalNestedHardwareClock(liveMemory(),d);});
  const initial=startMs91TandySample(memory,segment,{channel:0,offset:0x100,segment:0x7000,frequency:8000,repeats:0,picMask:0});binding.write(initial.writes);
  const pcm=new Float32Array(blocks.reduce((sum,frames)=>sum+frames,0));
  for(const frames of blocks){pcm.set(binding.render(frames),elapsed);elapsed+=frames;}
  assert.ok(pcm.every(Number.isFinite));assert.ok(pcm.some(value=>value!==0));
  assert.ok(bus.filter(([port,value])=>port===0xc4&&value===3).length>=2,'Full race replaces prior sample at delivered IRQ');
  assert.ok(activeRuntime.session.length>0,'Mixed sample fixture must actually advance and record driving frames');
  binding.close();assert.doesNotThrow(()=>assertAllocatedRaceAudioIdle(activeRuntime.session));
  return {pcm,bus,memory:liveMemory(),recordedFrames:activeRuntime.session.length};
 }
 if(continuation){
  const unsupportedMemory=memory.slice();
  const unsupported=createAllocatedTandyRaceAudio(()=>unsupportedMemory,d,segment,()=>0,()=>0,'ms-1991','ms-1991');
  assert.throws(()=>unsupported.tickProgram().next(),/sample/i,'Continuation requires explicit sampled-host capability');
  assert.equal(new DataView(unsupportedMemory.buffer).getUint16(d+0x4e6a,true),0,'Rejected continuation releases reentry guard');
  assert.deepEqual(unsupported.takeSampleStartRequests(),[],'Rejected continuation cannot queue sample work');
  const toneOnly=createNativeAllocatedSound(()=>unsupportedMemory,d,segment,{kind:'tandy',driverGeneration:'ms-1991',port61:()=>0,interruptCx:()=>0,bios(){assert.fail('Unsupported sample wait must reject before BIOS work');}},'ms-1991');
  assert.ok('tickWithSampleWait' in toneOnly);
  const beforeReject=unsupportedMemory.slice();
  await assert.rejects(toneOnly.tickWithSampleWait({write(){assert.fail('Unsupported sample wait cannot emit writes');},async replaceSample(){assert.fail('Unsupported sample wait cannot start sample');}}),/modern full Tandy/);
  assert.deepEqual(unsupportedMemory,beforeReject);
  const priorNote=memory[d+0x90e0+16];
  let currentMemory=memory;
  const allocated=createAllocatedTandyRaceAudio(()=>currentMemory,d,segment,()=>0,()=>0,'ms-1991','ms-1991','deferred');
  if(continuation.startsWith('pump')||fullRace){
   const cancelPump=continuation.endsWith('cancel');
   let pump:ReturnType<typeof createTandySampleContinuationPump>|undefined;
   const host=createMs91TandySampleHost(()=>memory,segment,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,write(){},gameInterrupt(){},afterInterrupt(position){if(pump?.waiting)pump.interrupt(position);}});
   host.start({channel:0,offset:0x100,segment:0x7000,frequency:8000,repeats:0});
   const positions:number[]=[];
   pump=createTandySampleContinuationPump({
    write(writes,position){for(const [port,value]of writes)host.writeBus(port,value,position);},
    bios(requests){assert.deepEqual(requests,[]);},status:host.status,requestStop:host.requestStop,
    start(request,position){positions.push(position);return host.start(request,position);},
   });
   let program=allocated.tickProgram();
   const length=activeRuntime.session.length;
   if(fullRace){
    activeRuntime.session.originalMemory.writeMemory(memory);
    const native=createNativeAllocatedSound(()=>memory,d,segment,{kind:'tandy',driverGeneration:'ms-1991',port61:()=>0,interruptCx:()=>0,bios(){assert.fail('Unexpected BIOS');},sampleStarts(){assert.fail('Race continuation must not deliver samples synchronously');}},physicsEngine);
    assert.ok('tickProgram' in native);
    program=advanceAllocatedRaceProgram(activeRuntime.session,native,{mouse:()=>({x:160,y:100,buttons:0}),joystickSteering:()=>0,controls:()=>1,keyDown:()=>0},{entryStackPointer:0xeefe-0x1c,incomingSI:0},()=>native.tickProgram());
   }
   assert.equal(pump.start(program,0),false);
   if(fullRace){assert.throws(()=>assertAllocatedRaceAudioIdle(activeRuntime.session),/pending audio/);assert.equal(activeRuntime.session.length,length);assert.equal(memory[d+0x408e],1,'Original timer guard held throughout sampled wait');}
   assert.equal(v.getUint16(d+0x4e6a,true),1);assert.equal(memory[d+0x90e0+16],priorNote);
   assert.equal(host.status(0),0,'Stopping sample remains busy while CPU callback waits');
   if(cancelPump)pump.close();
   host.advance(8);
   if(!cancelPump){
    assert.equal(positions.length,1);assert.ok(positions[0]>0&&positions[0]<=8);assert.equal(host.status(0),0);
    assert.equal(memory[d+0x90e0+16],5);
   }else{assert.equal(host.status(0),1);assert.deepEqual(positions,[]);assert.equal(memory[d+0x90e0+16],priorNote);}
   assert.equal(v.getUint16(d+0x4e6a,true),0);assert.equal(pump.waiting,false);
   if(fullRace){assert.doesNotThrow(()=>assertAllocatedRaceAudioIdle(activeRuntime.session));assert.equal(activeRuntime.session.physicsEngine,physicsEngine);assert.equal(memory[d+0x408e],0);assert.equal(v.getUint16(d+0x408c,true),0);if(cancelPump)assert.equal(activeRuntime.session.length,length);}
   pump.close();host.requestStop();host.advance(32);assert.equal(host.status(0),1);return;
  }
  if(continuation.startsWith('coordinated')){
   const host=createMs91TandySampleHost(()=>memory,segment,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,write(){},gameInterrupt(){}});
   assert.equal(host.start({channel:0,offset:0x100,segment:0x7000,frequency:8000,repeats:0}),true);
   let waits=0;const controller=new AbortController();
   const replace=createMs91TandySampleReplacement(host,async()=>{
    waits++;assert.equal(v.getUint16(d+0x4e6a,true),1);
    assert.equal(memory[d+0x90e0+16],priorNote);
    assert.equal(host.status(0),0);
    if(continuation==='coordinated-failure')throw Error('Allocated IRQ owner failure');
    host.advance(8);
    if(continuation==='coordinated-cancel')controller.abort();
   });
   const native=createNativeAllocatedSound(()=>memory,d,segment,{kind:'tandy',driverGeneration:'ms-1991',port61:()=>0,interruptCx:()=>0,bios(){assert.fail('Modern sample continuation cannot issue BIOS work');},sampleStarts(){assert.fail('Waiting continuation cannot use synchronous sample delivery');}},'ms-1991');
   assert.ok('tickWithSampleWait' in native);
   class SampleOwner{
    writes=0;
    write(writes:number[][]){this.writes++;for(const [port,value]of writes)host.writeBus(port,value);}
    replaceSample(request:Parameters<typeof replace>[0],signal?:AbortSignal){assert.ok(this.writes>0);return replace(request,signal);}
   }
   const owner=new SampleOwner();
   const pending=native.tickWithSampleWait(owner,controller.signal);
   if(continuation==='coordinated-failure')await assert.rejects(pending,/Allocated IRQ owner failure/);
   else assert.equal(await pending,continuation==='coordinated');
   assert.ok(waits>0,'Existing sample stop waits for actual host IRQ');
   assert.equal(v.getUint16(d+0x4e6a,true),0);assert.equal(memory[d+0x90e0+16],continuation==='coordinated'?5:priorNote);
   assert.equal(host.status(0),continuation==='coordinated-cancel'?1:0,'No fabricated completion or replacement after cancellation/failure');
   if(continuation!=='coordinated')assert.equal(v.getUint16(segment*16+0x578,true),0x132,'Failed/cancelled coordinator does not start replacement');
   host.requestStop();host.advance(32);assert.equal(host.status(0),1);return;
  }
  const program=allocated.tickProgram(),step=program.next();assert.equal(step.done,false);
  if(step.done)throw Error('Missing allocated sample continuation');
  if(continuation==='replaced'){
   currentMemory=memory.slice();new DataView(currentMemory.buffer).setUint16(d+0x4e6a,9,true);
   const untouched=currentMemory.slice();
   assert.throws(()=>program.next(),/memory replaced/);
   assert.deepEqual(currentMemory,untouched,'Old callback cannot commit to or unlock replacement memory');
   assert.equal(v.getUint16(d+0x4e6a,true),0,'Old callback releases only its owned original guard');return;
  }
  assert.equal(v.getUint16(d+0x4e6a,true),1,'Guard remains held while continuation waits');
  assert.equal(memory[d+0xa039],5,'Sample note is committed before delivery');
  assert.equal(memory[d+0x90e0+16],priorNote,'Trailing last-note update waits for callback return');
  const host=createMs91TandySampleHost(()=>memory,segment,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,write(){},gameInterrupt(){}});
  assert.equal(host.start(step.value.sampleStarts[0]),true);host.advance(8);
  const retainedCar=d+0x618e+24*76+75;memory[retainedCar]=87;
  v.setUint16(d+0x3340,100,true);
  const cursor=v.getUint16(segment*16+0x57e,true),busy=memory[segment*16+0x595];
  if(continuation==='resume'){const finished=program.next();assert.equal(finished.done,true);}
  else program.return(undefined as never);
  assert.equal(v.getUint16(d+0x4e6a,true),0,'Completion/cancellation releases original guard');
  assert.equal(memory[d+0x90e0+16],continuation==='resume'?5:priorNote);
  assert.equal(memory[retainedCar],87,'Resume preserves live car records changed while suspended');
  assert.equal(v.getUint16(d+0x3340,true),continuation==='resume'?0:100,'Resume uses live car cadence before original wrapping; cancellation does not run car callback');
  assert.equal(v.getUint16(segment*16+0x57e,true),cursor,'Resuming must preserve IRQ-updated cursor');assert.equal(memory[segment*16+0x595],busy);
  host.requestStop();host.advance(32);assert.equal(host.status(0),1);return;
 }
 let delivered=0,elapsed=0;const bus:number[][]=[];
 const audio=createNativeAllocatedSound(()=>memory,d,segment,{kind:'tandy',driverGeneration:'ms-1991',port61:()=>0,interruptCx:()=>0,bios(){assert.fail('Unexpected BIOS work');},sampleStarts(requests,live){
  delivered++;assert.equal(live,memory);assert.equal(v.getUint16(d+0x4e6a,true),0);
  const committed=readOriginalTandyRaceState(live,d,segment,'ms-1991');
  assert.equal(committed.voices[0][3],5);assert.equal(new DataView(committed.timers[16].buffer).getUint16(0,true),activePause?0x104:0x103);
  assert.deepEqual(requests,[{channel:0,offset:0x100,segment:0x7000,frequency:8000,repeats:differential?0:1}]);
  mixed.sampleStarts(requests,live);
 }},'ms-1991');
 const mixed=createMs91TandyRaceBinding(segment,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,
  initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,
  tone:{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1},sampleGain:0.5,
  busWrite(port,value,offset){bus.push([port,value,elapsed+offset]);}});
 mixed.attach(()=>memory,()=>{const writes=audio.tick();if(!activePause&&differential&&delivered&&mixed.status(0)===0&&bus.some(([port])=>port===0xc5))mixed.requestStop();return writes;});
 if(activePause){
  mixed.render(512);elapsed+=512;assert.equal(mixed.status(0),0);
  const cursorBefore=v.getUint16(segment*16+0x57e,true);
  const paused=controlAllocatedTandyDialogAudio(memory,d,segment,'pause-audio',mixed.port61,'ms-1991');mixed.write(paused.writes);
  assert.ok(paused.writes.some(([port,value])=>port===0xc7&&(value&0xe0)===0),'Pause delivers zero DAC amplitude');
  const muted=mixed.render(4800);elapsed+=4800;assert.ok(muted.every(Number.isFinite));assert.equal(mixed.status(0),0);
  assert.notEqual(v.getUint16(segment*16+0x57e,true),cursorBefore,'Sample IRQ transfer keeps advancing during pause');
  const cursorPaused=v.getUint16(segment*16+0x57e,true);
  const resumed=controlAllocatedTandyDialogAudio(memory,d,segment,'resume-audio',mixed.port61,'ms-1991');mixed.write(resumed.writes);
  assert.equal(v.getUint16(segment*16+0x57e,true),cursorPaused,'Resume must not restart sample transfer');
  // Original resume restores track volumes; unlike pause, it does not issue
  // immediate voice updates. The next owning game IRQ applies DAC amplitude.
  const beforeBus=bus.length;mixed.render(512);elapsed+=512;
  assert.ok(bus.slice(beforeBus).some(([port,value])=>port===0xc7&&(value&0xe0)!==0),'Next game IRQ restores nonzero DAC amplitude');
  mixed.requestStop();mixed.render(512);elapsed+=512;assert.equal(mixed.status(0),1);mixed.close();return;
 }
 const pcm=new Float32Array(blocks.reduce((sum,frames)=>sum+frames,0));
 for(const frames of blocks){pcm.set(mixed.render(frames),elapsed);elapsed+=frames;}
 assert.ok(pcm.every(Number.isFinite));assert.ok(pcm.some(value=>value!==0),'Allocated sampled effect produces actual mixed PCM');assert.ok(bus.some(([port])=>port===0xc5),'Committed allocated note reaches DAC output');
 assert.equal(mixed.status(0),1);mixed.close();
 assert.equal(delivered,1);assert.ok('takeSampleStartRequests' in audio);
 assert.ok(typeof audio.takeSampleStartRequests==='function');
 assert.deepEqual(audio.takeSampleStartRequests(),[],'Adapter delivers each committed batch once');
 return {pcm,bus,memory,delivered};
}
for(const differential of [false,true])assert.deepEqual(await run(differential,[5120]),await run(differential,[1,17,100,333,4669]),'Actual allocated race/audio output, bus timing and complete memory must not depend on buffer partition');
for(const differential of [false,true])await run(differential,[],true);
for(const differential of [false,true])for(const continuation of ['resume','cancel','replaced','pump','pump-cancel','coordinated','coordinated-cancel','coordinated-failure'] as const)await run(differential,[],false,continuation);
for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const differential of [false,true])for(const mode of ['race-pump','race-pump-cancel'] as const)await run(differential,[],false,mode,physicsEngine);
for(const sampleRate of [44100,48000])for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const differential of [false,true])assert.deepEqual(await run(differential,[5120],false,'race-mixed',physicsEngine,sampleRate),await run(differential,[1,17,100,333,4669],false,'race-mixed',physicsEngine,sampleRate));
assert.deepEqual(replay,original);assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),original);
console.log('Actual allocated modern race delivers raw/differential sample requests once after state commit; whole/split PCM, bus timing and complete memory match, source replay unchanged');
