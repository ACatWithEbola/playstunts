import type {OriginalMt32MpuProgram} from './mt32-transport.ts';
/** Internal ready-MPU adapter: acknowledges commands and collects original
 * bytes. Port61 reads and CPU delay loops are NOT converted to elapsed time.
 * Keep public launch gated until a timed host replaces this diagnostic path. */
export function executeReadyMt32Program(program:OriginalMt32MpuProgram){
 const writes:number[][]=[];let step=program.next();
 while(!step.done){const op=step.value;if(op.kind==='write')writes.push([op.port,op.value]);step=program.next(op.kind==='read'&&op.port===0x330?0xfe:0);}
 return {result:step.value,writes};
}
