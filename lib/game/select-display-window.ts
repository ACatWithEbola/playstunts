/** Original alternative display descriptors copy fifteen words forward.
 * Overlap and offset wrapping follow REP MOVSW; EGA restores the descriptor
 * selected by its retained display index rather than one fixed video buffer. */
export function selectOriginalDisplayWindow(memory:Uint8Array,mode:'cga'|'tandy'|'ega',offset:number,segment:number){
 const c=0x209e0,target=mode==='cga'?0x6862:mode==='tandy'?0x63d2:0x9112,u=(n:number)=>n&65535;
 for(let i=0;i<15;i++){const at=(segment&65535)*16+u(offset+i*2),value=memory[at&0xfffff]|(memory[(at+1)&0xfffff]<<8);memory[c+target+i*2]=value&255;memory[c+target+i*2+1]=value>>>8;}
}
export function restoreOriginalDisplayWindow(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega'){
 if(mode!=='ega'){selectOriginalDisplayWindow(memory,mode,mode==='cga'?0x6880:0x63f0,0x209e);return;}
 const c=0x209e0,u=(n:number)=>n&65535,word=(base:number,at:number)=>memory[base+u(at)]|(memory[base+u(at+1)]<<8),index=word(d,0x5638);
 memory[d+0x563a]=index&255;memory[d+0x563b]=index>>>8;
 const at=u(index*4+0xc0b6);selectOriginalDisplayWindow(memory,mode,word(c,at),word(c,at+2));
}
