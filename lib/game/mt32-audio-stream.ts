import {audioTimerSampleOffsets} from './audio-sample-clock.ts';
export interface Mt32StereoOutput {
 readonly sampleRate:number;
 write(writes:number[][]):void;
 /** Untimed state reconstruction while the playback stream is suspended. */
 prepare?(writes:number[][]):void;
 /** Release queued browser sound when the physical device is power-cycled. */
 onDeviceChange?(listener:()=>void):()=>void;
 render(frames:number):Float32Array;
}
/** Retains the original audio IRQ phase across browser buffers and race changes.
 * Synth output must use its native rate; Web Audio handles output resampling. */
export function createMt32AudioStream(output:Mt32StereoOutput,tick:()=>number[][]){
 let phase=0;
 return {write:(writes:number[][])=>output.write(writes),advanceClock(frames:number,onTick:()=>void){
  const clock=audioTimerSampleOffsets(phase,frames,output.sampleRate);phase=clock.phase;for(const _ of clock.offsets)onTick();
 },render(frames:number){
  if(!Number.isSafeInteger(frames)||frames<0)throw Error('Invalid Roland audio frame count');
  const result=new Float32Array(frames*2),clock=audioTimerSampleOffsets(phase,frames,output.sampleRate);phase=clock.phase;let position=0;
  const generate=(end:number)=>{if(end>position){const samples=output.render(end-position);if(samples.length!==(end-position)*2)throw Error('Roland synthesizer returned an incomplete stereo buffer');result.set(samples,position*2);position=end;}};
  for(const offset of clock.offsets){generate(offset);output.write(tick());}generate(frames);return result;
 }};
}
