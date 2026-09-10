/** Original driver-specific main startup defaults, before command-line switches.
 * The caller owns heap setup: ordinary modes configure memory through A000;
 * Tandy additionally reserves400 paragraphs (16KiB). EGA starts with alternate
 * screens enabled and a four-plane allocation divisor. */
export function initializeOriginalGameDisplayDefaults(memory:Uint8Array,d:number,mode:'mcga'|'cga'|'tandy'|'ega',configureHeap:(endSegment:number,reservedParagraphs:number)=>void,framePointer=0xeefe){
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode],units={mcga:1,cga:4,tandy:2,ega:8}[mode],v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 for(const [at,value] of [[0x90fa,units],[0x93da,units],[0x9ae8,-units],[0xa7e0,mode==='ega'?4:1]])v.setUint16(d+at+high,value&65535,true);
 configureHeap(0xa000,mode==='tandy'?0x400:0);
 memory[d+0xaa46+high]=mode==='ega'?1:0;
 memory[d+0xa003+high]=mode==='ega'?2:1;
 if(mode==='tandy'){
  // Original2C95D..2C9AD expands both driver material tables into packed
  // four-pixel patterns. Preserve sequential reads when the tables alias.
  const count=v.getInt16(d+0x52cc,true),first=v.getUint16(d+0x52ce,true),second=v.getUint16(d+0x52d0,true);
  for(const [at,value] of [[-18,count],[-4,first],[-2,d>>>4],[-10,second],[-8,d>>>4]])v.setUint16(d+((framePointer+at)&65535),value&65535,true);
  for(let i=0;i<count;i++)for(const pointer of [first,second]){
   const at=d+((pointer+i*2)&65535),colour=v.getUint16(at,true)&15;
   v.setUint16(at,v.getUint16(d+0x52d6+colour*2,true),true);
  }
 }
 memory[d+0xaa6e+high]=101;
}
