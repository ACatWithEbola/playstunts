/** Original245d0..245ec, called by1c42e: consume elapsed input ticks and
 * remember the current unsigned32-bit counter, preserving subtraction wrap. */
export function originalElapsedInputTicks(memory:Uint8Array,d:number){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),before=view.getUint32(d+0x4dcc,true),now=view.getUint32(d+0x407a,true);
 view.setUint32(d+0x4dcc,now,true);return (now-before)>>>0;
}
