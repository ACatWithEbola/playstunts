import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import createMunt from '../public/game/mt32-local/munt.mjs';
import {createMt32WasmOutput,type Mt32Wasm} from '../lib/game/mt32-wasm-output.ts';
import {createNativeDemoRuntime} from '../lib/game/native-demo-runtime.ts';
import {createBrowserAllocatedTimedMt32Race} from '../lib/game/browser-allocated-timed-mt32-race.ts';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
import {fixtureData} from './global-score-fixture.ts';
import type {OriginalMt32MpuProgram} from '../lib/game/mt32-transport.ts';
function virtual(program:OriginalMt32MpuProgram){const writes:number[][]=[];let step=program.next();while(!step.done){if(step.value.kind==='write')writes.push([step.value.port,step.value.value]);step=program.next(0);}return {result:step.value,writes};}
const demo=versionedDemoResource('ms-1991')!,snapshot=demo.bytes.slice(),base=fixtureData.base.slice();
const legacy=await fixtureData.catalog.read('DEFAULT.RPL');assert.ok(legacy);const legacyBefore=legacy.slice();
for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const generation of ['ms-1990','ms-1991'] as const){
 const recording:{bytes:Uint8Array;physicsEngine:'ms-1990'|'ms-1991';framesPerSecond:10|20}=physicsEngine==='ms-1991'?demo:{bytes:legacy,physicsEngine,framesPerSecond:20};
 const module=await createMunt({wasmBinary:readFileSync('public/game/mt32-local/munt.wasm'),print(){},printErr(){}});
 const device=createMt32WasmOutput(module as unknown as Mt32Wasm,readFileSync('public/game/mt32-local/ctrl_mt32_1_07.rom'),readFileSync('public/game/mt32-local/pcm_mt32.rom'));
 const browser={currentTime:0,state:'running',destination:{},createGain(){return {gain:{value:1},connect(){},disconnect(){}};},createBuffer(_n:number,frames:number){return {getChannelData:()=>new Float32Array(frames)};},createBufferSource(){return {connect(){},disconnect(){},start(){},stop(){}};}};
 const menu={configuration:Array.from(recording.bytes.subarray(0,24)),track:Array.from(recording.bytes.subarray(24,0x722)),name:'DEFAULT',camera:0,graphics:2,soundEnabled:true};
 let audio:Awaited<ReturnType<typeof createBrowserAllocatedTimedMt32Race>>|undefined;
 try{
  const runtime=await createNativeDemoRuntime({...fixtureData,experimental10Hz:true,demoReplay:recording,soundDevice:{kind:'mt32',driverGeneration:generation,execute:virtual}},menu);
  const forbidden=()=>{throw Error('Recorded demo must not read live driving input');};
  audio=await createBrowserAllocatedTimedMt32Race(browser as unknown as AudioContext,device,{generation,profile:{cpuHz:4772728,pollCycles:20,resetClocks:16705,initialPort61:0,interrupts(){},cancelled:()=>false,yieldTask:async()=>{}},runtime:()=>runtime,devices:()=>({mouse:forbidden,joystickSteering:forbidden,controls:forbidden,keyDown:forbidden}),patch:readFileSync('public/game/original-resources/MT32.PLB'),active:()=>true});
  let exited=false,pumps=0;
  for(;pumps<4000;pumps++){
   browser.currentTime+=.05;await audio.pump();runtime.render();
   if(runtime.finishFrame(0,0)==='exit'){exited=true;break;}
  }
  assert.equal(exited,true,'Timed original demo must reach its recorded end');
  assert.equal(runtime.session.physicsEngine,physicsEngine);assert.equal(runtime.session.framesPerSecond,recording.framesPerSecond);
  assert.equal(runtime.session.state.player.driving.car.grip.crash,3);
  const restored=await runtime.finish({writeAudio:audio.write,async gameCounter(){browser.currentTime+=.05;await audio!.pump();const memory=runtime.session.state.memory;return new DataView(memory.buffer,memory.byteOffset,memory.byteLength).getUint32(0x2d1a0+0x407a,true);},async releaseInput(){},showWaiting(){},copyBackBuffer(){},resetMouse(){}});
  assert.deepEqual(restored.configuration,menu.configuration);assert.deepEqual(restored.track,menu.track);
  await audio.closeAsync();assert.equal(device.active(),false);assert.ok(device.render(512).every(value=>value===0));
  console.log(`${generation}/${physicsEngine}: original ${recording.framesPerSecond}Hz demo reaches finish in ${pumps+1} mocked browser pumps, restores menu and releases real synth silently`);
 }finally{try{await audio?.closeAsync();}finally{device.close();}}
}
assert.deepEqual(demo.bytes,snapshot);assert.deepEqual(fixtureData.base,base);
assert.deepEqual(legacy,legacyBefore);
