import type {createEgaPlanarMemory} from './ega-planar-memory.ts';
import type {OriginalDisplayClearOperation} from './clear-display.ts';
/** Run a reconstructed drawing program against the native EGA aperture.
 * Reads feed the controller latches before the program continues. */
export function executeOriginalEgaDisplay<T>(aperture:ReturnType<typeof createEgaPlanarMemory>,program:Generator<OriginalDisplayClearOperation,T,number>):T{
 let step=program.next();
 while(!step.done){const op=step.value;let input=0;
  switch(op.kind){
   case 'port-byte':aperture.writePort(op.port,op.value);break;
   case 'port-word':aperture.writeWord(op.port,op.value);break;
   case 'read':input=aperture.readByte(op.offset);break;
   case 'write':aperture.writeByte(op.offset,op.value);break;
   case 'write-word':aperture.writeByte(op.offset,op.value);aperture.writeByte(op.offset+1,op.value>>>8);break;
  }
  step=program.next(input);
 }
 return step.value;
}
