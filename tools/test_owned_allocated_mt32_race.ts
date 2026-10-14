import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {readOriginalMt32RaceState} from '../lib/game/mt32-race-audio-memory.ts';
import {createBrowserAllocatedTimedMt32Race} from '../lib/game/browser-allocated-timed-mt32-race.ts';
import type {OriginalMt32MpuProgram} from '../lib/game/mt32-transport.ts';
import createMunt from '../public/game/mt32-local/munt.mjs';
import {createMt32WasmOutput,type Mt32Wasm} from '../lib/game/mt32-wasm-output.ts';
import {createTimedMt32SongFactory} from '../lib/game/timed-mt32-song-factory.ts';
import type {OriginalMt32MusicSeed} from '../lib/game/mt32-music-runtime.ts';
import type {NativeMusicScore} from '../lib/game/native-music-score.ts';
const replay=readFileSync('public/game/replays/CTKFIN.RPL'),before=Buffer.from(replay),patch=readFileSync('public/game/original-resources/MT32.PLB');
function virtual(program:OriginalMt32MpuProgram){const writes:number[][]=[];let step=program.next();while(!step.done){if(step.value.kind==='write')writes.push([step.value.port,step.value.value]);step=program.next(0);}return {result:step.value,writes};}
const fakeContext={currentTime:0,state:'running',destination:{},createGain(){return {gain:{value:1},connect(){},disconnect(){}};},createBuffer(_n:number,frames:number){return {getChannelData:()=>new Float32Array(frames)};},createBufferSource(){return {connect(){},disconnect(){},start(){},stop(){}};}};
const context=fakeContext as unknown as AudioContext;
const cars=process.argv.includes('--all-cars')?['ANSX','AUDI','COUN','FGTO','JAGU','LANC','LM02','P962','PC04','PMIN','VETT']:[String.fromCharCode(...replay.subarray(0,4))];
for(const generation of ['ms-1990','ms-1991'] as const)for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const car of cars){
 const configuration=Array.from(replay.subarray(0,24));configuration.splice(0,4,...Array.from(car,c=>c.charCodeAt(0)));
 const runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine,soundDevice:{kind:'mt32',driverGeneration:generation,execute:virtual}},{configuration,track:Array.from(replay.subarray(24,0x722)),name:'OWNED',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
 const memory=runtime.session.state.memory,d=0x2d1a0,read=()=>readOriginalMt32RaceState(runtime.session.state.memory,d,0x39e1,generation).driver;
 assert.equal(String.fromCharCode(...memory.subarray(d+0x8fc2,d+0x8fc6)),car,'Allocated fixture must load requested car');
 const driverBefore=read().slice();let delivered=0,ticks=0,guarded=0,hardware=0;
 memory[d+0x4090]=0;memory[d+0x4091]=0;
 const view=new DataView(memory.buffer),initialClock=view.getUint32(d+0x407a,true),initialGame=view.getUint32(d+0x407e,true),initialDivider=view.getUint16(d+0x4088,true),divider=view.getUint16(d+0x4086,true);
 const real=process.argv.includes('--real');let nonzero=0;
 const module=real?await createMunt({wasmBinary:readFileSync('public/game/mt32-local/munt.wasm'),print(){},printErr(){}}):undefined;
 const synthesizer=module?createMt32WasmOutput(module as unknown as Mt32Wasm,readFileSync('public/game/mt32-local/ctrl_mt32_1_07.rom'),readFileSync('public/game/mt32-local/pcm_mt32.rom')):undefined;
 const device={sampleRate:synthesizer?.sampleRate??32000,active:()=>synthesizer?.active()??false,write(batch:number[][]){delivered+=batch.length;synthesizer?.write(batch);},render(n:number){const samples=synthesizer?.render(n)??new Float32Array(n*2);assert.ok(samples.every(Number.isFinite));nonzero+=samples.filter(value=>value!==0).length;return samples;}};
 try{
 assert.ok(runtime.initializationWriteCount>0);
 // Owner performs initialization itself: only simulation-entry writes follow.
 const initialWrites=runtime.initialWrites.slice(runtime.initializationWriteCount);
 assert.ok(initialWrites.every(([port])=>port===0x330));
 const devices={mouse:()=>({x:160,y:100,buttons:0}),joystickSteering:()=>0,controls:()=>1,keyDown:()=>0};
 const audio=await createBrowserAllocatedTimedMt32Race(context,device,{generation,profile:{cpuHz:4772728,pollCycles:20,resetClocks:16705,initialPort61:0,interrupts(){},cancelled:()=>false,yieldTask:async()=>{}},runtime:()=>runtime,devices:()=>devices,patch,active:()=>true,onHardwareTick(dispatch){
  hardware++;
  if(!dispatch)guarded++;else ticks++;
 }});
 assert.deepEqual(read(),driverBefore,'Initialization must not mutate live allocated driver');
 const handle=new DataView(memory.buffer).getUint16(d+0x8016,true);
 await audio.write(runtime.audio.start(handle));await audio.write(runtime.audio.crash(handle));
 // Modern initialization packets can keep transport ahead of synthesis.
 // Pump enough retained sample time for guarded IRQs to become dispatchable.
 for(let i=0;i<400&&ticks===0;i++){fakeContext.currentTime+=.025;await audio.pump();}
 assert.ok(ticks>0);assert.ok(delivered>0);
 assert.equal(hardware,ticks+guarded,'Suppressed callbacks must not erase hardware boundaries');
 const finalView=new DataView(runtime.session.state.memory.buffer);
 assert.equal(finalView.getUint32(d+0x407a,true)-initialClock,hardware,'Guarded and dispatched paths each advance hardware counter exactly once');
 const wraps=hardware<initialDivider?0:1+Math.floor((hardware-initialDivider)/divider);
 assert.equal(finalView.getUint32(d+0x407e,true)-initialGame,wraps,'Original game-divider phase includes guarded ticks');
 if(guarded)assert.ok(finalView.getUint16(d+0x408a,true)>0,'Nested high-water marker records transport waits');
 assert.ok(Number.isSafeInteger(audio.initializationLeadFrames)&&audio.initializationLeadFrames>=0);
 console.log(`${generation}/${physicsEngine}/${car}: initial transport lead ${audio.initializationLeadFrames} samples (${(audio.initializationLeadFrames/device.sampleRate).toFixed(6)}s), ${guarded} guarded hardware ticks before callback dispatch`);
 assert.equal(runtime.session.physicsEngine,physicsEngine);
 assert.equal(new DataView(memory.buffer).getUint16(d+0x4e6a,true),0);
 await audio.suspendAsync();const pausedClock=hardware;fakeContext.currentTime+=.1;await audio.pump();assert.equal(hardware,pausedClock,'Suspended race must not simulate');
 audio.resume();fakeContext.currentTime+=.05;await audio.pump();assert.ok(hardware>pausedClock);
 await runtime.finish({writeAudio:audio.write,async gameCounter(){fakeContext.currentTime+=.05;await audio.pump();const live=runtime.session.state.memory;return new DataView(live.buffer,live.byteOffset,live.byteLength).getUint32(d+0x407a,true);},async releaseInput(){},showWaiting(){},copyBackBuffer(){},resetMouse(){},opponent:{async show(){},drawTime(){},async key(){return 27;}}});
 await audio.closeAsync();assert.doesNotThrow(()=>runtime.releaseMenuState());
 assert.equal(device.active(),false,'Race notes and tails must settle before results music');
 if(real)assert.ok(device.render(512).every(value=>value===0),'Released device must remain silent');
 if(real){
  const scores=['titl','slct','vict','over'] as const;
  const seeds=Object.fromEntries(scores.map(name=>[name,JSON.parse(readFileSync(`public/game/mt32-music-${name}-seed.json`,'utf8'))])) as Record<NativeMusicScore,OriginalMt32MusicSeed>;
  const factory=createTimedMt32SongFactory(device,seeds,patch,generation,{cpuHz:4772728,pollCycles:20,resetClocks:16705,initialPort61:0,interrupts(){},yieldTask:async()=>{}});
  for(const name of ['vict','over'] as const){
  const victory=await factory(name,()=>false);let audible=0;
  try{
   for(let at=0;at<device.sampleRate;at+=512){const samples=await victory.score.render(Math.min(512,device.sampleRate-at));assert.ok(samples.every(Number.isFinite));audible+=samples.filter(value=>value!==0).length;}
   assert.ok(audible>0,'Results score must play after race owner releases the same device');
  }finally{victory.score.close();await victory.release();}
  assert.equal(device.active(),false);assert.ok(device.render(512).every(value=>value===0));
  console.log(`${generation}/${physicsEngine}: same-device ${name} handoff produces finite music and returns to silence`);
  }
 }
 if(real){assert.ok(nonzero>0,'Actual synthesizer must produce race audio');console.log(`${generation}/${physicsEngine}: ${nonzero} nonzero finite synthesized sample values`);}
 }finally{synthesizer?.close();}
}
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),before);
console.log(`${cars.length*4} actual allocated car/driver/physics combinations initialize and deliver start/crash/ticks through owned timed browser adapter; virtual resource startup, ${process.argv.includes('--real')?'real Munt PCM':'synthetic PCM'}, not listening/main-game proof`);
