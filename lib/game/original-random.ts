/** Original byte generator atbc3b. Retain all six bytes across calls. */
export function originalRandomByte(memory:Uint8Array,d:number){
 let value=memory[d+0x9f61];
 for(let offset=0x9f60;offset>=0x9f5c;offset--){value=(value+memory[d+offset])&255;memory[d+offset]=value;}
 for(let offset=0x9f61;offset>=0x9f5c;offset--){memory[d+offset]=(memory[d+offset]+1)&255;if(memory[d+offset])break;}
 return memory[d+0x9f5c];
}
/** Original1bcbc: C-library generator, byte generator, timer low word and
 * saved race counter, followed by signed16-bit absolute value. Timer state
 * is supplied by the caller's clock; this routine does not sample wall time. */
export function originalRandomWord(memory:Uint8Array,d:number){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const next=(Math.imul(view.getUint32(d+0x38a2,true),0x343fd)+0x269ec3)>>>0;
 view.setUint32(d+0x38a2,next,true);
 const value=(((next>>>16)&32767)+originalRandomByte(memory,d)+view.getUint16(d+0x407a,true)+view.getUint16(d+0x899e,true))&65535;
 return value&32768?(-value)&65535:value;
}
