import {createOriginalTandyPsg,type OriginalTandyPsgVariant} from './tandy-psg.ts';
import {createOriginalPcSpeakerAudio} from './pc-speaker-audio.ts';
import {audioTimerSampleOffsets} from './audio-sample-clock.ts';
import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
export interface OriginalTandyToneOutputOptions {variant:OriginalTandyPsgVariant;clockHz:number;psgGain:number;speakerGain:number}
/** Native PSG plus TD15's supplementary PC-tone channel. Clock/profile and
 * mix gains are explicit. The20Hz DC blocker and gains approximate an output
 * circuit; they are not a measured vintage loudspeaker response. DAC output
 * is intentionally rejected until its hardware scheduler is implemented. */
export function createOriginalTandyToneAudio(sampleRate:number,options:OriginalTandyToneOutputOptions){
 if(!Number.isSafeInteger(sampleRate)||sampleRate<8000||!Number.isFinite(options.clockHz)||options.clockHz<=0||![options.psgGain,options.speakerGain].every(v=>Number.isFinite(v)&&v>=0))throw Error('Invalid Tandy output configuration');
 const psg=createOriginalTandyPsg(options.variant),speaker=createOriginalPcSpeakerAudio(sampleRate),clocksPerSample=options.clockHz/sampleRate,coefficient=Math.exp(-2*Math.PI*20/sampleRate);let lastInput=0,lastOutput=0;
 return {
  get port61(){return speaker.port61;},
  write(port:number,value:number){
   if(port===0xc0||port===0xc1)psg.write(value);
   else if(port===0x42||port===0x43||port===0x61||port===0x40)speaker.write(port,value);
   else if(port===0xc6||port===0xc7)throw Error('Tandy DAC output requires the sample hardware scheduler');
   else throw Error('Unreconstructed Tandy sound output port');
  },
  render(samples:number){
   const result=speaker.render(samples);
   for(let i=0;i<samples;i++){const input=psg.advanceClocks(clocksPerSample)/clocksPerSample;lastOutput=coefficient*(lastOutput+input-lastInput);lastInput=input;result[i]=lastOutput*options.psgGain+result[i]*options.speakerGain;}
   return result;
  },
 };
}
/** Original100Hz driver timing over native tone generation. Sample-bearing
 * callbacks cannot silently fall back to tones. The caller supplies the
 * explicit interrupted-register context to its runtime.tick closure. */
export function createOriginalTandyToneStream(runtime:{tick():{writes:number[][];bios:OriginalTandyBiosSound[]}},initialWrites:number[][],sampleRate:number,options:OriginalTandyToneOutputOptions,existingAudio?:ReturnType<typeof createOriginalTandyToneAudio>){
 const audio=existingAudio??createOriginalTandyToneAudio(sampleRate,options);let phase=0;
 const write=(writes:number[][])=>{for(const [port,value] of writes)audio.write(port,value);};if(!existingAudio)write([[0x43,0xb6]]);write(initialWrites);
 return {write,get port61(){return audio.port61;},render(samples:number){
  const clock=audioTimerSampleOffsets(phase,samples,sampleRate),result=new Float32Array(samples);let position=0;
  for(const boundary of clock.offsets){result.set(audio.render(boundary-position),position);position=boundary;const output=runtime.tick();if(output.bios.length)throw Error('Tandy BIOS sample requests require the DAC backend');write(output.writes);}
  result.set(audio.render(samples-position),position);phase=clock.phase;return result;
 }};
}
