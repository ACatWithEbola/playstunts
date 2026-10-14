/** Original222F3..2232B counter update before registered callbacks.
 * BIOS acknowledgement/chaining stays at the browser hardware boundary. */
export function advanceOriginalHardwareClock(memory:Uint8Array,d:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),before=v.getInt16(d+0x4088,true);
 v.setUint16(d+0x4088,(before-1)&65535,true);
 // DEC/JG compares the mathematical signed result, including overflow.
 if(before<=1){v.setUint32(d+0x407e,(v.getUint32(d+0x407e,true)+1)>>>0,true);v.setUint16(d+0x4088,v.getUint16(d+0x4086,true),true);}
 const callbacks=memory[d+0x4090]===0;
 if(callbacks)v.setUint32(d+0x407a,(v.getUint32(d+0x407a,true)+1)>>>0,true);
 return callbacks;
}
/** Original guarded IRQ path still updates counters and nesting high-water mark. */
export function advanceOriginalNestedHardwareClock(memory:Uint8Array,d:number){
 const callbacks=advanceOriginalHardwareClock(memory,d);
 if(!callbacks){memory[d+0x408e]=0;new DataView(memory.buffer,memory.byteOffset,memory.byteLength).setUint16(d+0x408c,0,true);}
 if(callbacks&&memory[d+0x408e]){
  const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
  const nested=(view.getUint16(d+0x408c,true)+1)&65535;
  view.setUint16(d+0x408c,nested,true);
  if(view.getInt16(d+0x408a,true)<(nested<<16>>16))view.setUint16(d+0x408a,nested,true);
 }
 return callbacks;
}
