import {createPacedMt32Output} from './paced-mt32-output.ts';
import {createMt32PitTransportHost} from './mt32-pit-transport-host.ts';
import type {Mt32StereoOutput} from './mt32-audio-stream.ts';
import type {TimedMt32Host} from './timed-mt32-program.ts';
import {PC_PIT_INPUT_HZ} from './timer-interrupt.ts';
/** Shared transport/synthesis timeline. An owning execution profile must supply
 * CPU costs, MPU responses and advancing clocks; none are inferred here. */
export function createSampleTimedMt32Device(device:Mt32StereoOutput,profile:TimedMt32Host&{
 now():number;advanceTo(clock:number):void;poll():Promise<void>;initialPort61:number;
}){
 const paced=createPacedMt32Output(device);let closed=false,failed=false,lastWriteFrame:number|undefined;
 const requireActive=()=>{if(closed||profile.cancelled())throw new DOMException('Roland timeline cancelled','AbortError');if(failed)throw Error('Roland timeline failed');};
 const clock=()=>{const value=profile.now();if(!Number.isSafeInteger(value)||value<0)throw Error('Invalid Roland execution clock');return value;};
 const transport=createMt32PitTransportHost({
  read(port){requireActive();return profile.read(port);},
  write(port,value){
   requireActive();
   if(port===0x330){const at=clock();paced.schedule(at,[[port,value]]);lastWriteFrame=Math.ceil(at*device.sampleRate/PC_PIT_INPUT_HZ);return;}
   return profile.write(port,value);
  },interrupts(value){requireActive();return profile.interrupts(value);},delay(loop,count){requireActive();return profile.delay(loop,count);},
  cancelled:()=>closed||failed||profile.cancelled(),yieldTask:profile.yieldTask?()=>profile.yieldTask!():undefined,
 },{now:clock,poll:()=>profile.poll(),initialPort61:profile.initialPort61});
 const output:Mt32StereoOutput={sampleRate:device.sampleRate,
  get renderedFrame(){return paced.frame;},get lastWriteFrame(){return lastWriteFrame;},
  irqReady(){requireActive();return clock()<=Math.ceil(paced.frame*PC_PIT_INPUT_HZ/device.sampleRate);},
  // All score writes must pass through transport so their timestamps survive.
  write(writes){requireActive();if(writes.length)throw Error('Untimed Roland delivery is not allowed');},
  render(frames){
   requireActive();
   try{
   const samples=paced.render(frames);
   const end=Math.ceil(paced.frame*PC_PIT_INPUT_HZ/device.sampleRate);
   const target=Math.max(clock(),end);profile.advanceTo(target);
   if(clock()<target)throw Error('Roland execution profile did not advance');
   return samples;
   }catch(error){failed=true;paced.close();throw error;}
  }};
 return {transport,output,get frame(){return paced.frame;},close(){closed=true;paced.close();}};
}
