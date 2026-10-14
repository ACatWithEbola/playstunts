import type {createMs91TandySampleHost} from './ms91-tandy-sample-host.ts';
type Host=ReturnType<typeof createMs91TandySampleHost>;
type Request=Parameters<Host['start']>[0];
export async function waitForMs91TandySampleStop(host:Pick<Host,'requestStop'|'status'>,waitForInterrupt:(signal?:AbortSignal)=>Promise<void>,signal?:AbortSignal){
 if(signal?.aborted)return false;
 const wait=()=>new Promise<boolean>((resolve,reject)=>{
  const cleanup=()=>signal?.removeEventListener('abort',abort);
  const abort=()=>{cleanup();resolve(false);};
  signal?.addEventListener('abort',abort,{once:true});
  if(signal?.aborted){abort();return;}
  try{Promise.resolve(waitForInterrupt(signal)).then(()=>{cleanup();resolve(true);},error=>{cleanup();reject(error);});}catch(error){cleanup();reject(error);}
 });
 host.requestStop();
 while(host.status(0)===0){if(!await wait()||signal?.aborted)return false;}
 return !signal?.aborted;
}
/** Cooperative original stop/wait/start ownership. The CPU host must deliver
 * real pending interrupts while waiting; this helper neither advances time nor
 * clears busy state. Cancellation prevents starting the replacement, but does
 * not undo the already-issued stop request. True means callback completion,
 * including zero-length/no-transfer samples; false means unsupported/cancelled. */
export function createMs91TandySampleReplacement(host:Pick<Host,'requestStop'|'status'|'start'>,waitForInterrupt:(signal?:AbortSignal)=>Promise<void>){
 let replacing=false;
 return async(request:Request,signal?:AbortSignal)=>{
  if(replacing)throw Error('Tandy sample replacement already in progress');
  const owned={channel:request.channel,offset:request.offset,segment:request.segment,frequency:request.frequency,repeats:request.repeats};
  for(const key of ['channel','offset','segment','frequency','repeats'] as const)if(!Number.isInteger(owned[key])||owned[key]<0||owned[key]>65535)throw Error('Invalid Tandy sample replacement word');
  if(owned.channel!==0)return false;
  if(signal?.aborted)return false;
  replacing=true;
  try{
   if(!await waitForMs91TandySampleStop(host,waitForInterrupt,signal))return false;
   host.start(owned);return true;
  }finally{replacing=false;}
 };
}
