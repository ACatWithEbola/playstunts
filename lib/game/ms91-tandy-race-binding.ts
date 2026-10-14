import {createMs91TandyMixedAudio} from './ms91-tandy-mixed-audio.ts';
import {createMs91TandySampleReplacement,waitForMs91TandySampleStop} from './ms91-tandy-sample-replacement.ts';
import {createTandySampleContinuationPump} from './tandy-sample-continuation-pump.ts';
type Mixed=ReturnType<typeof createMs91TandyMixedAudio>;
type Options=Parameters<typeof createMs91TandyMixedAudio>[2];
/** Explicit race/audio ownership bridge. Browser caller supplies hardware
 * reset/profile values, attaches after allocation and closes before freeing
 * banks. Active sample replacement still requires a CPU continuation owner. */
export function createMs91TandyRaceBinding(segment:number,supplied:Omit<Options,'gameInterrupt'>){
 const options={...supplied,initialDac:{...supplied.initialDac},tone:{...supplied.tone}};
 const lifetime=new AbortController();
 let mixed:Mixed|undefined,memory:(()=>Uint8Array)|undefined,irqPosition:number|undefined,closed=false,replacementPending=false;
 let continuation:ReturnType<typeof createTandySampleContinuationPump>|undefined;
 let quiescing=false;
 const current=()=>{if(closed||!mixed)throw Error('Tandy race audio is not attached');return mixed;};
 return {
  sampleRate:options.sampleRate,get port61(){return mixed?.port61??0;},
  attach(nextMemory:()=>Uint8Array,tick:()=>number[][],program?:()=>Parameters<ReturnType<typeof createTandySampleContinuationPump>['start']>[0],nestedInterrupt?:()=>void){
   if(closed)throw Error('Tandy race audio is closed');
   if(replacementPending)throw Error('Tandy race attachment during pending replacement');
   if(quiescing)throw Error('Tandy race sample stop is not complete');
   if(continuation?.waiting)throw Error('Tandy race attachment during pending CPU continuation');
   if(irqPosition!==undefined)throw Error('Tandy race attachment during IRQ');
   if(mixed&&mixed.status(0)===0)throw Error('Tandy race attachment requires completed sample stop');
   // Construct first so rejected replacement cannot destroy the prior stream.
   let nextContinuation:ReturnType<typeof createTandySampleContinuationPump>|undefined;
   const next=createMs91TandyMixedAudio(nextMemory,segment,{...options,afterInterrupt(offset){
    irqPosition=offset;try{if(nextContinuation?.waiting)nextContinuation.interrupt(offset);options.afterInterrupt?.(offset);}finally{irqPosition=undefined;}
   },gameInterrupt(offset){
    irqPosition=offset;try{
     if(quiescing){nestedInterrupt?.();return [];}
     if(nextContinuation){if(nextContinuation.waiting)nestedInterrupt?.();else nextContinuation.start(program!(),offset);return [];}
     return tick();
    }finally{irqPosition=undefined;}
   }});
   if(program)nextContinuation=createTandySampleContinuationPump({write:(writes,offset)=>next.writeAt(writes,offset),bios(requests){if(requests.length)throw Error('Modern Tandy continuation cannot execute BIOS requests');},status:next.status,requestStop:next.requestStop,start:next.startAt});
   continuation?.close();mixed?.close();mixed=next;memory=nextMemory;continuation=nextContinuation;
  },
  sampleStarts(requests:Parameters<Mixed['startAt']>[0][],live:Uint8Array){
   const audio=current();if(irqPosition===undefined||memory!()!==live)throw Error('Tandy sample delivery requires the attached owning game IRQ');
   for(const request of requests)audio.startAt(request,irqPosition);
  },
  write(writes:number[][]){current().write(writes);},render(frames:number){return current().render(frames);},
  requestStop(){return current().requestStop();},
  async stopForResourceRelease(waitForInterrupt:(signal?:AbortSignal)=>Promise<void>,signal?:AbortSignal){
   const audio=current();if(irqPosition!==undefined||replacementPending)throw Error('Tandy resource stop overlaps sound work');
   if(signal?.aborted)return false;
   replacementPending=true;quiescing=true;continuation?.cancel();
   try{const stopped=await waitForMs91TandySampleStop(audio,waitForInterrupt,signal?AbortSignal.any([signal,lifetime.signal]):lifetime.signal);if(stopped)quiescing=false;return stopped;}
   finally{replacementPending=false;}
  },
  async replaceSample(request:Parameters<Mixed['start']>[0],waitForInterrupt:(signal?:AbortSignal)=>Promise<void>,signal?:AbortSignal){
   const audio=current();if(irqPosition!==undefined)throw Error('Tandy replacement requires a suspended CPU continuation');
   if(replacementPending)throw Error('Tandy race sample replacement already pending');
   replacementPending=true;
   try{return await createMs91TandySampleReplacement(audio,waitForInterrupt)(request,signal?AbortSignal.any([signal,lifetime.signal]):lifetime.signal);}finally{replacementPending=false;}
  },
  status(channel:number){return current().status(channel);},
  close(){if(closed)return;closed=true;lifetime.abort();continuation?.close();continuation=undefined;mixed?.close();mixed=undefined;memory=undefined;},
 };
}
