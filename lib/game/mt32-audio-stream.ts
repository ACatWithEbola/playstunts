import {audioTimerSampleOffsets} from './audio-sample-clock.ts';
export interface Mt32StereoOutput {
 readonly sampleRate:number;
 /** Present only on an explicitly sample-timed transport owner. */
 readonly renderedFrame?:number;
 readonly lastWriteFrame?:number;
 write(writes:number[][]):void;
 /** Untimed state reconstruction while the playback stream is suspended. */
 prepare?(writes:number[][]):void;
 /** Release queued browser sound when the physical device is power-cycled. */
 onDeviceChange?(listener:()=>void):()=>void;
 render(frames:number):Float32Array;
 /** Timed owner suppresses reentry while an earlier IRQ's transport is ahead
  * of synthesis. Hardware/sample phase continues even without a callback. */
 irqReady?():boolean;
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
/** Await transport at each original IRQ boundary before generating subsequent
 * samples. Failed partial renders poison the stream instead of replaying an
 * already applied tick. Caller owns device lifetime and wall-clock scheduling. */
export function createTimedMt32AudioStream(output:Mt32StereoOutput,tick:()=>Promise<number[][]>,onHardwareTick?:(dispatch:boolean)=>void){
 let phase=0,queue:Promise<unknown>=Promise.resolve(),failed=false;
 return {render(frames:number):Promise<Float32Array>{
  if(!Number.isSafeInteger(frames)||frames<0)return Promise.reject(Error('Invalid Roland audio frame count'));
  const pending=queue.catch(()=>{}).then(async()=>{
   if(failed)throw Error('Roland timed audio stream failed');
   const clock=audioTimerSampleOffsets(phase,frames,output.sampleRate),result=new Float32Array(frames*2);let position=0;
   const generate=(end:number)=>{
    if(end>position){const samples=output.render(end-position);if(samples.length!==(end-position)*2)throw Error('Roland synthesizer returned an incomplete stereo buffer');result.set(samples,position*2);position=end;}
   };
   try{
    for(const boundary of clock.offsets){
     generate(boundary);const dispatch=!output.irqReady||output.irqReady();
     // The owning game updates hardware counters even when a busy transport
     // suppresses its registered music callback. No memory layout is inferred.
     onHardwareTick?.(dispatch);
     if(dispatch)output.write(await tick());
    }
    generate(frames);phase=clock.phase;return result;
   }catch(error){failed=true;throw error;}
  });queue=pending;return pending;
 }};
}
