import {allocateResourcePages} from './allocate-resource-pages.ts';
/** Original16966..1697E: the renderer owns a10400-byte primitive queue. */
export function allocateOriginalRenderQueue(before:Uint8Array,d:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const result=allocateResourcePages(before,d,0x3266,651);if(result.error)return result;
 const v=new DataView(result.memory.buffer,result.memory.byteOffset,result.memory.byteLength);
 const at=0x558c+{mcga:0,cga:0x5da,tandy:0x616,ega:0x462}[mode];
 v.setUint16(d+at,result.offset,true);v.setUint16(d+at+2,result.segment,true);return result;
}
