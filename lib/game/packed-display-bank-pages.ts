const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original CGA2E01A/TDY2D6DA indexed-bank allocation estimate, including
 * signed dimension multiplication and division that truncates toward zero. */
export function originalPackedDisplayBankPages(memory:Uint8Array,mode:'cga'|'tandy',segment:number){
 const base=u(segment)*16,word=(at:number)=>memory[(base+u(at))&0xfffff]|(memory[(base+u(at+1))&0xfffff]<<8),count=word(4);let total=u(count*8+16);
 for(let index=0;index<count;index++){
  const table=u(count*4+index*4+6),address=(base+u(count*8+6)+word(table)+word(table+2)*65536)&0xfffff,width=memory[address]|(memory[address+1]<<8),height=memory[address+2]|(memory[address+3]<<8);
  total=(total+((s(width)*s(height))>>(mode==='cga'?2:1))+16)|0;
 }
 return Math.trunc(((total+16)|0)/16)&65535;
}
/** Original CGA2DF90/TDY2D64A planar-bank estimate uses a signed truncated
 * word product before expansion, unlike the indexed-bank calculation. */
export function originalPlanarDisplayBankPages(memory:Uint8Array,mode:'cga'|'tandy',segment:number){
 const base=u(segment)*16,word=(at:number)=>memory[(base+u(at))&0xfffff]|(memory[(base+u(at+1))&0xfffff]<<8),count=word(4);let total=s(u(count*8+16));
 for(let index=0;index<s(count);index++){
  const table=u(count*4+index*4+6),address=(base+u(count*8+6)+word(table)+word(table+2)*65536)&0xfffff,width=memory[address]|(memory[address+1]<<8),height=memory[address+2]|(memory[address+3]<<8);total=(total+(s(width*height)<<(mode==='cga'?1:2))+16)|0;
 }
 return Math.trunc(((total+16)|0)/16)&65535;
}
