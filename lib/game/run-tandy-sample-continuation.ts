import type {createAllocatedTandyRaceAudio} from './allocated-tandy-race-audio.ts';
type Program=ReturnType<ReturnType<typeof createAllocatedTandyRaceAudio>['tickProgram']>;
type Boundary=Extract<ReturnType<Program['next']>,{done?:false}>['value'];
/** Explicit suspended-CPU owner. Hardware time is supplied by replaceSample;
 * this runner never clears busy, fabricates an IRQ or advances game physics. */
export async function runTandySampleContinuation(program:Program,owner:{
 write(writes:number[][]):void|Promise<void>;
 bios(requests:Boundary['bios'],signal?:AbortSignal):void|Promise<void>;
 replaceSample(request:Boundary['sampleStarts'][number],signal?:AbortSignal):Promise<boolean>;
},signal?:AbortSignal):Promise<boolean>{
 try{
  if(signal?.aborted)return false;
  let step=program.next();
  while(!step.done){
   const pendingWrites=step.value.writes.map(write=>write.slice()),pendingBios=step.value.bios.map(request=>({...request})),pendingSamples=step.value.sampleStarts.map(request=>({...request}));
   const writes=owner.write(pendingWrites);if(writes)await writes;
   if(signal?.aborted)return false;
   const bios=owner.bios(pendingBios,signal);if(bios)await bios;
   if(signal?.aborted)return false;
   for(const request of pendingSamples){
    if(signal?.aborted||!await owner.replaceSample(request,signal))return false;
   }
   if(signal?.aborted)return false;
   step=program.next();
  }
  const pendingWrites=step.value.writes.map(write=>write.slice()),pendingBios=step.value.bios.map(request=>({...request}));
  const writes=owner.write(pendingWrites);if(writes)await writes;
  if(signal?.aborted)return false;
  const bios=owner.bios(pendingBios,signal);if(bios)await bios;
  return !signal?.aborted;
 }finally{program.return(undefined as never);}
}
