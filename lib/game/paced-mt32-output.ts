import type {Mt32StereoOutput} from './mt32-audio-stream.ts';
import {PC_PIT_INPUT_HZ} from './timer-interrupt.ts';
/** Delivers timed transport bytes on the synthesizer's sample timeline.
 * Clocks are absolute from frame0; this layer neither invents transport delays
 * nor owns the device. Scheduling requires already ordered complete writes. */
export function createPacedMt32Output(output:Mt32StereoOutput){
 if(!Number.isSafeInteger(output.sampleRate)||output.sampleRate<=0)throw Error('Invalid Roland scheduled sample rate');
 const events:{frame:number;writes:number[][]}[]=[];let cursor=0,lastClock=0,nextEvent=0,failed=false,closed=false;
 const requireHealthy=()=>{if(closed)throw Error('Roland paced output closed');if(failed)throw Error('Roland paced output failed');};
 return {get frame(){return cursor;},close(){closed=true;events.length=0;nextEvent=0;},schedule(clock:number,writes:number[][]){
  requireHealthy();
  if(!Number.isSafeInteger(clock)||clock<lastClock||!Number.isSafeInteger(clock*output.sampleRate))throw Error('Invalid Roland scheduled clock');
  const frame=Math.ceil(clock*output.sampleRate/PC_PIT_INPUT_HZ);
  if(frame<cursor)throw Error('Roland write is behind the rendered timeline');
  events.push({frame,writes:writes.map(pair=>pair.slice())});lastClock=clock;
 },render(frames:number){
  requireHealthy();
  if(!Number.isSafeInteger(frames)||frames<0||!Number.isSafeInteger(cursor+frames))throw Error('Invalid paced Roland frame count');
  const result=new Float32Array(frames*2),end=cursor+frames;let at=0;
  const generate=(target:number)=>{while(cursor<target){const count=Math.min(512,target-cursor),samples=output.render(count);if(samples.length!==count*2)throw Error('Roland synthesizer returned an incomplete stereo buffer');result.set(samples,at);at+=samples.length;cursor+=count;}};
  try{
   while(nextEvent<events.length&&events[nextEvent].frame<=end){const event=events[nextEvent];generate(event.frame);output.write(event.writes);nextEvent++;}
   generate(end);
   if(nextEvent){events.splice(0,nextEvent);nextEvent=0;}
   return result;
  }catch(error){failed=true;throw error;}
 }};
}
