import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {createMs91TandyRaceBinding} from '../lib/game/ms91-tandy-race-binding.ts';
const replay=readFileSync('public/game/replays/CTKFIN.RPL'),original=replay.slice();
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const binding=createMs91TandyRaceBinding(0x39e1,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,
  initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,
  tone:{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1},sampleGain:0.5,busWrite(){}});
 const runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine,soundDevice:{kind:'tandy',driverGeneration:'ms-1991',port61:()=>binding.port61,interruptCx:()=>0,sampleStarts:binding.sampleStarts,bios(){assert.fail('Unexpected modern BIOS');}}},
  {configuration:Array.from(replay.subarray(0,24)),track:Array.from(replay.subarray(24,0x722)),name:'TDPause',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
 binding.attach(()=>runtime.session.state.memory,()=>runtime.audio.tick());binding.write(runtime.initialWrites);
 binding.write(runtime.audio.produce());binding.render(4800);
 const memory=runtime.session.state.memory,d=0x2d1a0;
 const sequence=()=>Array.from({length:24},(_,i)=>memory.slice(d+0x801e+i*72,d+0x801e+i*72+4));
 for(let cycle=0;cycle<5;cycle++){
  const before=sequence(),music=memory[d+0x4e03],sound=memory[d+0x4e05];
  binding.write(runtime.dialogAudio('pause-audio'));assert.equal(memory[d+0x4e02],1);
  assert.ok(binding.render(4800).every(Number.isFinite));assert.deepEqual(sequence(),before,'Pause does not advance sound sequence pointers');
  binding.write(runtime.dialogAudio('resume-audio'));assert.equal(memory[d+0x4e02],0);
  assert.deepEqual(sequence(),before,'Resume does not restart sound sequence pointers');assert.equal(memory[d+0x4e03],music);assert.equal(memory[d+0x4e05],sound);
  assert.ok(binding.render(4800).every(Number.isFinite));
 }
 binding.close();
}
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),original);
console.log('Ten allocated pause/resume cycles through full Tandy race binding retain sequence pointers and sound/music settings across both physics editions; finite PCM/source replay preserved');
