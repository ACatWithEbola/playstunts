export type OriginalIndexedDisplayMode='ega'|'cga'|'tandy';
/** Original EGA26ABE, CGA26044 and TDY25F1E table loaders.
 * Read each source byte live: overlapping source/table storage and16-bit
 * source-offset wrapping are part of the original routines. No RGB remapping. */
export function loadOriginalDisplayColourTables(memory:Uint8Array,d:number,mode:OriginalIndexedDisplayMode,offset:number,segment:number){
 if(memory.length!==0x100000||d<0||d+65536>memory.length)throw Error('Original display tables require a complete address space');
 offset&=65535;segment&=65535;
 for(let index=0;index<256;index++){
  const value=memory[(segment*16+((offset+index)&65535))&0xfffff];
  if(mode==='ega'){
   memory[d+0x53f2+index]=value>>>4;memory[d+0x5502+index]=value&15;
  }else if(mode==='cga'){
   for(let part=0;part<4;part++)memory[d+0x5344+part*256+index]=((value>>>(6-part*2))&3)*0x55;
  }else{
   memory[d+0x547c+index]=value&240;memory[d+0x557c+index]=value&15;
   memory[d+0x567c+index]=(value<<4)&255;memory[d+0x577c+index]=value>>>4;
  }
 }
}
