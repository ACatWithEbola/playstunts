import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import createMunt from '../public/game/mt32-local/munt.mjs';
import {createMt32WasmOutput,type Mt32Wasm} from '../lib/game/mt32-wasm-output.ts';
import {createTimedMt32SongFactory} from '../lib/game/timed-mt32-song-factory.ts';
import type {OriginalMt32MusicSeed} from '../lib/game/mt32-music-runtime.ts';
import type {NativeMusicScore} from '../lib/game/native-music-score.ts';
import {PC_PIT_INPUT_HZ} from '../lib/game/timer-interrupt.ts';
import {advanceOriginalNestedHardwareClock} from '../lib/game/hardware-clock-memory.ts';
import {remixedMusicTiming} from '../lib/game/remixed-music.ts';
import {ms91SunoTiming} from '../lib/game/ms91-suno-music.ts';
const fullScores=process.argv.includes('--full-scores');
const names=['titl','slct','vict','over'] as const;
const seeds=Object.fromEntries(names.map(name=>[name,JSON.parse(readFileSync(`public/game/mt32-music-${name}-seed.json`,'utf8'))])) as Record<NativeMusicScore,OriginalMt32MusicSeed>;
const snapshot=JSON.stringify(seeds);
const control=readFileSync('public/game/mt32-local/ctrl_mt32_1_07.rom'),pcm=readFileSync('public/game/mt32-local/pcm_mt32.rom'),wasm=readFileSync('public/game/mt32-local/munt.wasm'),patch=readFileSync('public/game/original-resources/MT32.PLB');
for(const generation of ['ms-1990','ms-1991'] as const){
 const diagnostics:string[]=[];
 const module=await createMunt({wasmBinary:wasm,print:(message:string)=>diagnostics.push(message),printErr:(message:string)=>diagnostics.push(message)});
 const device=createMt32WasmOutput(module as unknown as Mt32Wasm,control,pcm);
 try{
  const hardware:boolean[]=[];
  const d=0x2d1a0,memory=new Uint8Array(0x100000),view=new DataView(memory.buffer);
  view.setUint16(d+0x4086,5,true);view.setUint16(d+0x4088,5,true);
  const factory=createTimedMt32SongFactory(device,seeds,patch,generation,{cpuHz:4772728,pollCycles:20,resetClocks:Math.ceil(.014*PC_PIT_INPUT_HZ),initialPort61:0,interrupts(){},yieldTask:async()=>{}},dispatch=>{
   // Explicit canonical-memory fixture owner, not production integration.
   // Clear prior callback ownership only when transport permits a new one.
   if(dispatch){memory[d+0x408e]=0;view.setUint16(d+0x408c,0,true);}
   hardware.push(dispatch);advanceOriginalNestedHardwareClock(memory,d);
   if(dispatch)memory[d+0x408e]=1;
  });
  for(const name of names){
   const song=await factory(name,()=>false);assert.equal(device.active(),false,'Startup queue settles before song');
   let nonzero=0;
   // Exercise the actual original synthesizer beyond two complete calibrated
   // score periods. This does not substitute for browser scheduling/listening.
   const timing=generation==='ms-1991'?ms91SunoTiming[name]:remixedMusicTiming[name];
   const seconds=fullScores?Math.ceil(Math.max('introDuration' in timing?timing.introDuration??0:0,timing.loopDuration)*2+2):1;
   const totalFrames=device.sampleRate*seconds;
   for(let frames=0;frames<totalFrames;frames+=512){
    const samples=await song.score.render(Math.min(512,totalFrames-frames));
    assert.ok(samples.every(Number.isFinite));nonzero+=samples.filter(value=>value!==0).length;
   }
   assert.ok(nonzero>0);
   await song.score.control('pause-audio');assert.equal(song.score.settings.paused,1);
   let pausedEnergy=0;
   for(let frames=0;frames<device.sampleRate*2;frames+=512){
    const samples=await song.score.render(Math.min(512,device.sampleRate*2-frames));
    assert.ok(samples.every(Number.isFinite));
    if(frames>=device.sampleRate)pausedEnergy+=samples.reduce((sum,value)=>sum+value*value,0);
   }
   assert.ok(Number.isFinite(pausedEnergy),'Original synth may retain reverb while paused; browser suspension owns audible silence');
   await song.score.control('resume-audio');assert.equal(song.score.settings.paused,0);
   let resumedNonzero=0;
   for(let frames=0;frames<device.sampleRate;frames+=512){
    const samples=await song.score.render(Math.min(512,device.sampleRate-frames));
    assert.ok(samples.every(Number.isFinite));resumedNonzero+=samples.filter(value=>value!==0).length;
   }
   assert.ok(resumedNonzero>0,'Resume must restore actual synthesized music');
   song.score.close();await song.release();
   assert.equal(device.active(),false,'Old song notes and reverb must settle before reuse');
   const silence=device.render(512);assert.ok(silence.every(value=>value===0),'No old song resumes after release');
   console.log(`${generation}/${name}: ${seconds}s real PCM plays, pause/resume renders stay finite and resume restores music; released device silent and reusable`);
  }
  console.log(`${generation}: ${diagnostics.length} original synth diagnostics retained; no listening fidelity claim`);
  assert.ok(hardware.length>1000,'Hardware observer must survive every song and paused render');
  // The short deterministic fixture crosses a guarded transfer. Full-score
  // endpoints change IRQ phase and need not cross one during control calls.
  if(!fullScores)assert.ok(hardware.some(dispatch=>!dispatch),'Timed song/control transfers notify guarded boundaries instead of erasing them');
  assert.equal(view.getUint32(d+0x407a,true),hardware.length,'Game input clock advances once per actual audio hardware boundary');
  assert.equal(view.getUint32(d+0x407e,true),Math.floor(hardware.length/5),'Game divider retains its original phase across all song/control transitions');
  if(hardware.some(dispatch=>!dispatch))assert.ok(view.getUint16(d+0x408a,true)>0,'Original guarded high-water counter survives real synthesis transfers');
  console.log(`${generation}: ${hardware.length} hardware notifications, ${hardware.filter(dispatch=>!dispatch).length} guarded; includes pause/resume transfers`);
 }finally{device.close();}
}
assert.equal(JSON.stringify(seeds),snapshot);
