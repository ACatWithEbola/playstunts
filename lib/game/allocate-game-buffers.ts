import {allocateResourcePages} from './allocate-resource-pages.ts';
const regions:readonly (readonly [number,number])[]=[
 [0x73d2,0x70a],[0x7f9a,0x70a],[0x7ff4,0x70a],
 [0x9352,0x80],[0x935e,0x80],[0x9ae4,0x80],[0x9ac6,0x80],
 [0xa3c4,0x60],[0x8ff6,0x180],[0x70e0,0x120],[0xa772,0x18],
 [0x9356,0x385],[0x9ad0,0x385],[0x9c40,0x2ee0],
 [0x8fee,0x385],[0x9aea,0x385],[0xa466,0x385],[0x8a48,0x70a],
 [0x9c4e,0x385],[0x9fec,0x385],[0xa9ec,0x30],[0x92fc,0x16c],[0x9004,0xf0],
];
/** Original28F6..2A62: one persistent27471-byte allocation shared by track,
 * replay and simulation buffers. The source byte allocator rounds to1717 pages. */
export function allocateOriginalGameBuffers(before:Uint8Array,d:number,framePointer:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const allocated=allocateResourcePages(before,d,0x5d,1717);if(allocated.error)return allocated;
 const memory=allocated.memory,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);let offset=allocated.offset;
 const upper={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode],middle=mode==='ega'?0x460:upper;
 for(const [base,size] of regions){const at=base+(base===0x73d2||base===0x7f9a||base===0x70e0?middle:upper);v.setUint16(d+at,offset,true);v.setUint16(d+at+2,allocated.segment,true);offset=(offset+size)&65535;}
 v.setUint16(d+((framePointer-4)&65535),offset,true);v.setUint16(d+((framePointer-2)&65535),allocated.segment,true);
 return {...allocated,endOffset:offset};
}
