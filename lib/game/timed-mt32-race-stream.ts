import {createTimedMt32AudioStream,type Mt32StereoOutput} from './mt32-audio-stream.ts';
import {createMt32MusicWriteProgram} from './mt32-music-write-program.ts';
import {executeTimedMt32Program,type TimedMt32Host} from './timed-mt32-program.ts';
/** Explicit initialized race transport. Caller owns device, execution profile,
 * original memory and IRQ guards. Control writes and rendering share one queue;
 * no ready-port fallback or speculative timing is selected. */
export function createTimedMt32RaceStream(output:Mt32StereoOutput,transport:TimedMt32Host,driver:()=>Uint8Array,generation:'ms-1990'|'ms-1991',tick:()=>number[][],onHardwareTick?:(dispatch:boolean)=>void,tickWithDelivery?:(deliver:(writes:number[][])=>Promise<void>)=>Promise<number[][]>){
 if(generation!=='ms-1990'&&generation!=='ms-1991')throw Error('Unsupported timed Roland race driver');
 let closed=false,failed=false,queue:Promise<unknown>=Promise.resolve();
 const check=()=>{if(closed||transport.cancelled())throw new DOMException('Roland race stream closed','AbortError');if(failed)throw Error('Roland race stream failed');};
 const host:TimedMt32Host={...transport,cancelled:()=>closed||transport.cancelled()};
 const deliver=async(writes:number[][])=>{
  check();const program=createMt32MusicWriteProgram(driver(),writes,generation);
  if(await executeTimedMt32Program(program,host)!==0)throw Error('Roland race transport failed');
  check();
 };
 const enqueue=<T>(operation:()=>Promise<T>)=>{const pending=queue.catch(()=>{}).then(async()=>{check();try{return await operation();}catch(error){failed=true;throw error;}});queue=pending;return pending;};
 const guarded:Mt32StereoOutput={sampleRate:output.sampleRate,write(writes){check();output.write(writes);},render(frames){check();return output.render(frames);},...(output.irqReady?{irqReady(){check();return output.irqReady!();}}:{})};
 const stream=createTimedMt32AudioStream(guarded,async()=>{check();const writes=tickWithDelivery?await tickWithDelivery(deliver):tick();check();await deliver(writes);return [];},onHardwareTick);
 return {sampleRate:output.sampleRate,
  render(frames:number){if(!Number.isSafeInteger(frames)||frames<0)return Promise.reject(Error('Invalid Roland race frame count'));return enqueue(()=>stream.render(frames));},
  writeAsync(writes:number[][]){const retained=writes.map(pair=>pair.slice());return enqueue(()=>deliver(retained));},
  async drain(){await queue;check();},
  close(){closed=true;},
  async closeAsync(){closed=true;await queue.catch(()=>{});},
 };
}
