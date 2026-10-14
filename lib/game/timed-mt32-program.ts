import type {OriginalMt32MpuProgram} from './mt32-transport.ts';
export interface TimedMt32Host {
 read(port:number):number|Promise<number>;
 write(port:number,value:number):void|Promise<void>;
 interrupts(enabled:boolean):void|Promise<void>;
 /** CPU loop duration must come from the selected execution profile. */
 delay(loop:'decrement-dx',iterations:number):void|Promise<void>;
 cancelled():boolean;
 /** Optional owning-host responsiveness boundary, not a hardware delay. */
 yieldTask?():Promise<void>;
}
/** Ordered transport execution, with timing explicitly owned by the host.
 * No ready status, timer value or CPU-loop duration is silently invented. */
export async function executeTimedMt32Program(program:OriginalMt32MpuProgram,host:TimedMt32Host){
 const check=()=>{if(host.cancelled())throw new DOMException('Roland transport cancelled','AbortError');};
 check();let step=program.next(),operations=0;
 try{
  while(!step.done){
   check();const operation=step.value;let result=0;
   // Immediate port responses do not need a Promise turn for every byte.
   // Actual asynchronous devices remain awaited, and the explicit bounded
   // responsiveness yield below still owns cancellation opportunities.
   if(operation.kind==='read'){const value=host.read(operation.port);result=typeof value==='number'?value:await value;if(!Number.isInteger(result)||result<0||result>255)throw Error('Invalid Roland port response');}
   else if(operation.kind==='write'){const pending=host.write(operation.port,operation.value);if(pending!==undefined)await pending;}
   else if(operation.kind==='interrupts'){const pending=host.interrupts(operation.enabled);if(pending!==undefined)await pending;}
   else{const pending=host.delay(operation.loop,operation.iterations);if(pending!==undefined)await pending;}
   check();
   if(host.yieldTask&&++operations===4096){operations=0;await host.yieldTask();check();}
   step=program.next(result);
  }
  return step.value;
 }finally{program.return(0);}
}
