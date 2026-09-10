/** Supplied 17421..17479: advance parallel primitive/mask streams, skipping
 * grouped successors when the rejected parent lacks flag bit2.
 */
export function advanceOriginalPrimitiveStream(memory:Uint8Array,d:number,next:readonly number[],includeOffset:number,excludeOffset:number,visible:boolean,flags:number,paintCount:number){
 let offset=next[0]&65535;const segment=next[1]&65535;
 includeOffset=(includeOffset+4)&65535;excludeOffset=(excludeOffset+4)&65535;
 let skipped=0;
 if(!visible&&!(flags&2)){
  const byte=(n:number)=>memory[(segment*16+((offset+n)&65535))&0xfffff];
  while(byte(1)&2){
   const vertices=memory[d+((0x3270+byte(0))&65535)];
   offset=(offset+vertices+paintCount+2)&65535;includeOffset=(includeOffset+4)&65535;excludeOffset=(excludeOffset+4)&65535;skipped++;
  }
 }
 return {offset,segment,includeOffset,excludeOffset,skipped};
}
