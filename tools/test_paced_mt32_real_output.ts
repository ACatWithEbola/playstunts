import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import createMunt from '../public/game/mt32-local/munt.mjs';
import {createMt32WasmOutput,type Mt32Wasm} from '../lib/game/mt32-wasm-output.ts';
import {createPacedMt32Output} from '../lib/game/paced-mt32-output.ts';
import {applyOriginalMt32DriverControl} from '../lib/game/mt32-driver-control.ts';
import {createMt32MusicWriteProgram} from '../lib/game/mt32-music-write-program.ts';
import {createMt32PitTransportHost} from '../lib/game/mt32-pit-transport-host.ts';
import {executeTimedMt32Program} from '../lib/game/timed-mt32-program.ts';
import {PC_PIT_INPUT_HZ} from '../lib/game/timer-interrupt.ts';
const control=readFileSync('public/game/mt32-local/ctrl_mt32_1_07.rom'),pcm=readFileSync('public/game/mt32-local/pcm_mt32.rom'),wasm=readFileSync('public/game/mt32-local/munt.wasm');
async function render(chunked:boolean,pacedTiming=true,generation:'ms-1990'|'ms-1991'='ms-1991'){
 const module=await createMunt({wasmBinary:wasm});
 const device=createMt32WasmOutput(module as unknown as Mt32Wasm,control,pcm);
 try{
  // Diagnostic only: normalize every underlying synth call to one frame to
  // distinguish Munt call-size dependence from the outer scheduler's timing.
  const singleSample=process.argv.includes('--single-sample');
  let renderedFrames=0;const scheduled:number[][]=[],delivered:number[][]=[];
  const synthesis={sampleRate:device.sampleRate,write(writes:number[][]){for(const [,value] of writes)delivered.push([renderedFrames,value]);device.write(writes);},render(frames:number){
   let result:Float32Array;
   if(singleSample){result=new Float32Array(frames*2);for(let i=0;i<frames;i++)result.set(device.render(1),i*2);}else result=device.render(frames);
   renderedFrames+=frames;return result;
  }};
  const output=createPacedMt32Output(synthesis);let clock=0;
  const host=createMt32PitTransportHost({read:()=>0,write(port,value){const at=pacedTiming?clock:0;scheduled.push([Math.ceil(at*device.sampleRate/PC_PIT_INPUT_HZ),value]);output.schedule(at,[[port,value]]);},interrupts(){},delay(){},cancelled:()=>false},{initialPort61:0,now:()=>clock,async poll(){clock++;}});
  const patch=new Uint8Array(100),voice=new Uint8Array(46);patch[18]=12;patch[68]=7;patch[69]=100;patch[70]=64;
  const writes=applyOriginalMt32DriverControl('instrument',1,voice,patch,0,0,generation).writes.concat(applyOriginalMt32DriverControl('note',1,voice,patch,64,100,generation).writes);
  await executeTimedMt32Program(createMt32MusicWriteProgram(new Uint8Array(1750),writes,generation),host);
  assert.equal(clock,generation==='ms-1991'?33305:0);
  const frames=device.sampleRate*2,result=new Float32Array(frames*2);let at=0;
  while(at<frames){const count=Math.min(chunked?137:frames,frames-at);result.set(output.render(count),at*2);at+=count;}
  assert.ok(result.every(Number.isFinite));assert.ok(result.some(value=>value!==0),'Timed instrument and note must generate actual Munt output');
  assert.deepEqual(delivered,scheduled,'Every byte reaches real synthesizer on its scheduled frame');
  assert.deepEqual(delivered.map(([,value])=>value),writes.map(([,value])=>value),'Real output retains original byte order');
  return {pcm:result,delivered};
 }finally{device.close();}
}
const firstDifference=(a:Float32Array,b:Float32Array)=>a.findIndex((value,index)=>value!==b[index]);
for(const generation of ['ms-1990','ms-1991'] as const){
const split=await render(true,true,generation),repeat=await render(true,true,generation),whole=await render(false,true,generation);assert.equal(split.pcm.length,whole.pcm.length);
assert.deepEqual(split.delivered,whole.delivered);assert.deepEqual(split.delivered,repeat.delivered);
for(let i=0;i<split.pcm.length;i++)assert.equal(split.pcm[i],repeat.pcm[i],`Repeated identical-buffer sample ${i}`);
console.log(JSON.stringify({generation,identicalBufferRepeat:firstDifference(split.pcm,repeat.pcm),differentBuffer:firstDifference(split.pcm,whole.pcm)}));
const plainSplit=await render(true,false,generation),plainWhole=await render(false,false,generation);
console.log(JSON.stringify({generation,untimedDeviceDifferentBuffer:firstDifference(plainSplit.pcm,plainWhole.pcm)}));
if(process.argv.includes('--single-sample'))for(let i=0;i<split.pcm.length;i++)assert.equal(split.pcm[i],whole.pcm[i],`Normalized sample ${i}`);
}
// Bundled TVP.nextPitch uses rand()&3 to model MCU pitch variation. Shared
// random consumption can depend on per-partial render run boundaries. Exact
// cross-partition waveform equality is diagnostic, not an invented guarantee.
console.log('Real local Munt/ROM output: exact MIDI sample delivery, repeated-buffer PCM equality and finite nonzero synthesis pass; cross-partition pitch variation reported, browser listening still required');
