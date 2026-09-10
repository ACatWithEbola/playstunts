import type {OriginalMt32MpuProgram} from './mt32-transport.ts';
/** Ready-MPU diagnostic, with bounded browser work. Yields are responsiveness
 * boundaries, NOT recovered CPU or MIDI timing. Writes before each boundary
 * are delivered to the device present then; they are not saved for power-on. */
export async function executeCooperativeReadyMt32Program(program:OriginalMt32MpuProgram,host:{write(writes:number[][]):void;cancelled():boolean;yieldTask?:()=>Promise<void>;operationsPerYield?:number}){
 const quantum=host.operationsPerYield??4096;
 if(!Number.isSafeInteger(quantum)||quantum<1)throw Error('Invalid Roland work quantum');
 const yieldTask=host.yieldTask??(()=>new Promise<void>(resolve=>setTimeout(resolve,0)));
 let step=program.next(),count=0,writes:number[][]=[];
 const flush=()=>{if(writes.length){host.write(writes);writes=[];}};
 const check=()=>{if(host.cancelled())throw new DOMException('Roland startup cancelled','AbortError');};
 check();
 while(!step.done){
  const op=step.value;if(op.kind==='write')writes.push([op.port,op.value]);
  step=program.next(op.kind==='read'&&op.port===0x330?0xfe:0);
  if(++count===quantum){flush();count=0;await yieldTask();check();}
 }
 check();flush();return step.value;
}
