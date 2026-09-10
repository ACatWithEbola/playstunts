const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original31236 allocation estimate. Its partial-width allowance and
 * truncated per-bitmap product are preserved rather than recomputed from
 * the converted bank size. Allocated source banks have offset zero. */
export function originalEgaBitmapBankPages(memory:Uint8Array,segment:number){
 const base=u(segment)*16,word=(at:number)=>memory[(base+u(at))&0xfffff]|(memory[(base+u(at+1))&0xfffff]<<8),count=word(4);let total=s(u(count*8+16));
 for(let index=0;index<s(count);index++){
  const table=u(count*4+index*4+6),address=(base+u(count*8+6)+word(table)+word(table+2)*65536)&0xfffff,width=memory[address]|(memory[address+1]<<8),height=memory[address+2]|(memory[address+3]<<8);
  const bytes=u(((s(width)>>1)&0xfffc)*height+(width&7?height:0));total=(total+bytes+16)|0;
 }
 return ((total+16)>>4)&65535;
}
