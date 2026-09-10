import {allocateResourcePages} from './allocate-resource-pages.ts';
/** Original2B91..2BA9: twenty1072-byte replay checkpoints. The byte allocator
 * reserves one additional paragraph even for this exact multiple of16. */
export function allocateOriginalReplayCheckpoints(before:Uint8Array,d:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const result=allocateResourcePages(before,d,0x90,1341);if(result.error)return result;
 const v=new DataView(result.memory.buffer,result.memory.byteOffset,result.memory.byteLength);
 const at=0xa030+{mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode];
 v.setUint16(d+at,result.offset,true);v.setUint16(d+at+2,result.segment,true);return result;
}
