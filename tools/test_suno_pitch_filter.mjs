import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {sunoPitchFilter} from './suno_pitch_filter.mjs';
const rate=48000,base=741,target=440,shifted=Math.round(rate*target/base);
function measure(raw){
 const values=Array.from({length:raw.length/4},(_,i)=>raw.readFloatLE(i*4));
 let bestHz=0,bestEnergy=-1;
 for(let step=0;step<=200;step++){
  const hz=target-5+step*.05;let re=0,im=0;
  for(let i=0;i<values.length;i++){const phase=2*Math.PI*hz*i/rate;re+=values[i]*Math.cos(phase);im+=values[i]*Math.sin(phase);}
  const energy=re*re+im*im;if(energy>bestEnergy){bestEnergy=energy;bestHz=hz;}
 }
 return bestHz;
}
for(const inputRate of [32000,44100,48000]){
 const raw=execFileSync('ffmpeg',['-v','error','-f','lavfi','-i',`sine=frequency=${base}:sample_rate=${inputRate}:duration=0.3`,'-af',sunoPitchFilter(rate,shifted).join(','),'-t','0.2','-ar',String(rate),'-ac','1','-f','f32le','pipe:1']);
 const measured=measure(raw);assert.ok(Math.abs(measured-target)<.15,`${inputRate}: ${measured}`);
}
for(const bad of [NaN,0,44100.5,192001])assert.throws(()=>sunoPitchFilter(rate,bad),/sample rate/);
console.log('Actual FFmpeg pitch stays440Hz for32/44.1/48kHz inputs; malformed rate guards pass. Synthetic sine only, not Suno-character approval.');
