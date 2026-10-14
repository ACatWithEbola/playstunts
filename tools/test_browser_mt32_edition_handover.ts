/** Real synthesizer, mocked WebAudio. Retain external power across editions. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import createMunt from '../public/game/mt32-local/munt.mjs';
import {createMt32WasmOutput,type Mt32Wasm} from '../lib/game/mt32-wasm-output.ts';
import {createBrowserNativeMt32Music} from '../lib/game/browser-native-mt32-music.ts';
import {createBrowserNativeTimedMt32Music} from '../lib/game/browser-native-timed-mt32-music.ts';
import {PC_PIT_INPUT_HZ} from '../lib/game/timer-interrupt.ts';
import {createSwitchableMt32Output} from '../lib/game/switchable-mt32-output.ts';
import {createBrowserTimedMt32Session} from '../lib/game/browser-timed-mt32-session.ts';
const module=await createMunt({wasmBinary:readFileSync('public/game/mt32-local/munt.wasm'),print(){},printErr(){}});
const device=createMt32WasmOutput(module as unknown as Mt32Wasm,readFileSync('public/game/mt32-local/ctrl_mt32_1_07.rom'),readFileSync('public/game/mt32-local/pcm_mt32.rom'));
let physicalCloses=0,energy=0,loads=0;
const retainedDevice={...device,close(){physicalCloses++;device.close();}};
const power=createSwitchableMt32Output(32000,async()=>{loads++;if(loads===1)return retainedDevice;
 const next=createMt32WasmOutput(module as unknown as Mt32Wasm,readFileSync('public/game/mt32-local/ctrl_mt32_1_07.rom'),readFileSync('public/game/mt32-local/pcm_mt32.rom'));
 return {...next,close(){physicalCloses++;next.close();}};
});
const parameter=()=>({value:1,setValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){},cancelAndHoldAtTime(){}});
const context={sampleRate:48000,currentTime:0,state:'running',destination:{},createGain(){return {gain:parameter(),connect(){},disconnect(){}};},createBuffer(channels:number,frames:number){const data=Array.from({length:channels},()=>new Float32Array(frames));return {getChannelData:(index:number)=>data[index],copyToChannel:(samples:Float32Array,index:number)=>data[index].set(samples),data};},createBufferSource(){return {buffer:undefined as undefined|{data:Float32Array[]},connect(){},disconnect(){},start(){if(this.buffer)for(const channel of this.buffer.data)for(const sample of channel){assert.ok(Number.isFinite(sample));energy+=sample*sample;}},stop(){}};}};
const oldFetch=globalThis.fetch;
globalThis.fetch=(async input=>new Response(readFileSync('public'+String(input)))) as typeof fetch;
try{
 for(const mode of ['ready','timed','ready','timed']){
  const before=energy;
  if(mode==='ready'){
   const connection=await createBrowserNativeMt32Music(context as unknown as AudioContext,new AbortController().signal,power as never);
   try{connection.music.play('slct');assert.ok(energy>before);}
   finally{connection.music.close();connection.output.close();}
  }else{
   const connection=await createBrowserNativeTimedMt32Music(context as unknown as AudioContext,new AbortController().signal,power as never,'ms-1991',{cpuHz:4772728,pollCycles:20,resetClocks:Math.ceil(.014*PC_PIT_INPUT_HZ),initialPort61:0,interrupts(){},yieldTask:async()=>{}});
   try{await connection.music.playAsync('slct');assert.ok(energy>before);}
   finally{await connection.music.closeAsync();}
  }
  assert.equal(power.device,retainedDevice);assert.equal(physicalCloses,0,'Edition handover cannot close caller-owned power');
  assert.equal(loads,1,'Edition handover must reuse actual switchable power device');
 }
 console.log('Ready1990→timed1991→ready1990→timed1991 retains one real synthesizer and produces finite nonzero scheduled PCM; mocked WebAudio, not listening proof');
 // Real panel power-off must silence synthesis without killing music control.
 const live=await createBrowserTimedMt32Session({context:context as unknown as AudioContext,signal:new AbortController().signal,power:power as never,generation:'ms-1991',profile:{cpuHz:4772728,pollCycles:20,resetClocks:Math.ceil(.014*PC_PIT_INPUT_HZ),initialPort61:0,interrupts(){},cancelled:()=>false,yieldTask:async()=>{}},patch:readFileSync('public/game/original-resources/MT32.PLB'),clock:{callbackCounter:0,gameCounter:0,divisor:5,countdown:5},wallTicks:()=>0});
 await live.music.playAsync('slct');power.powerOff();
 const offEnergy=energy;await live.music.playAsync('titl');
 assert.equal(energy,offEnergy,'Power-off schedules silence rather than using the closed device');
 assert.equal(live.music.failure,undefined);assert.equal(physicalCloses,1);
 const race=live.race();await race.stopMusic();
 race.device.write([[0x330,0x90],[0x330,60],[0x330,100]]);
 assert.ok(race.device.render(512).every(sample=>sample===0),'Off race bridge drops writes and renders silence');
 assert.equal(race.device.active(),false);
 assert.equal(await power.powerOn(),true);assert.notEqual(power.device,retainedDevice);
 const resumedEnergy=energy;await live.music.playAsync('slct');assert.ok(energy>resumedEnergy);
 await live.closeAsync();assert.equal(physicalCloses,1,'Music does not close replacement caller-owned power');
 assert.equal(loads,2);console.log('Real switchable panel off→silent song change→fresh device on→Menu plays without closed-device access');
}finally{globalThis.fetch=oldFetch;power.close();assert.equal(physicalCloses,2,'Physical owner releases each device exactly once');}
