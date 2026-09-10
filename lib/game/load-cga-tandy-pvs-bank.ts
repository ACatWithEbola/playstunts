import {loadNativeCgaTandyPesBank} from './load-cga-tandy-pes-bank.ts';
import {packNativeResidentBitmapBank} from './pack-resident-bitmap-bank.ts';
import {acquireCachedResource} from './acquire-cached-resource.ts';
import {selectOriginalBitmapFile} from './select-bitmap-file.ts';
import {loadNativePvsBank} from './load-pvs-bank.ts';
import {convertNativeResidentPackedDisplayBank} from './convert-resident-packed-display-bank.ts';
import type {NativeOptionalPvsFileHost} from './load-selected-pvs-bank.ts';
/** Original CGA2DB4A/TDY2D21A PVS paths with mode-specific filename frames,
 * cache-first search, decoding, unflip and original palette conversion. */
export async function loadOptionalNativeCgaTandyPvsBank(host:NativeOptionalPvsFileHost,d:number,mode:'cga'|'tandy',nameOffset:number,framePointer:number){
 const selected=await selectOriginalBitmapFile({memory:()=>host.memory(),cached(at){const result=acquireCachedResource(host.memory(),d,at);host.writeMemory(result.memory);return result.found?{offset:result.offset,segment:result.segment}:null;},exists:at=>host.exists(at)},d,nameOffset,framePointer,{extensionTable:mode==='cga'?0x5298:0x53ce,filenameDistance:0x78,frameSize:mode==='cga'?0x7a:0x7c,cacheBeforeFiles:true});
 if(selected.cached)return selected.cached;
 let extension='';for(let i=0;i<65536;i++){const byte=host.memory()[d+((selected.extension+i)&65535)];if(!byte)break;extension+=String.fromCharCode(byte);}
 const bytes=await host.read(selected.filename);if(!bytes||!bytes.length)return null;
 if(extension==='.PES'){const loaded=loadNativeCgaTandyPesBank(host.memory(),d,mode,selected.filename,bytes);host.writeMemory(loaded.memory);if(loaded.error||!loaded.resource)throw Error('Original planar bitmap allocation failed: '+loaded.error);return {offset:0,segment:loaded.segment};}
 if(extension!=='.PVS')throw Error(`Original ${mode} bitmap format requires its own loader: ${extension}`);
 const source=loadNativePvsBank(host.memory(),d,selected.filename,mode==='cga'?0x52ad:0x53e5,bytes);host.writeMemory(source.memory);if(source.error||!source.resource)throw Error('Original PVS allocation failed: '+source.error);
 const converted=convertNativeResidentPackedDisplayBank(source.memory,d,mode,source.segment,selected.filename);host.writeMemory(converted.memory);if(converted.error||!converted.resource)throw Error('Original display conversion failed: '+converted.error);
 return {offset:0,segment:converted.segment};
}

/** Original CGA2E45C/TDY2DB16 compressed loading and basename cache. */
export async function loadOptionalNativeCompressedCgaTandyPvsBank(host:NativeOptionalPvsFileHost,d:number,mode:'cga'|'tandy',nameOffset:number,framePointer:number){
 const cached=acquireCachedResource(host.memory(),d,nameOffset);host.writeMemory(cached.memory);if(cached.found)return {offset:cached.offset,segment:cached.segment};
 const source=await loadOptionalNativeCgaTandyPvsBank(host,d,mode,nameOffset,(framePointer-20)&65535);if(!source)return null;
 const memory=host.memory(),descriptor=new DataView(memory.buffer,memory.byteOffset,memory.byteLength).getUint16(d+0x4b14,true),packed=packNativeResidentBitmapBank(memory,d,source.segment,descriptor,nameOffset);host.writeMemory(packed.memory);
 if(packed.error||!packed.resource)throw Error('Original compressed display bitmap allocation failed: '+packed.error);return {offset:0,segment:packed.segment};
}
