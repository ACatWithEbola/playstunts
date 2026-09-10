import {loadNativeEgaPesBank} from './load-ega-pes-bank.ts';
import {packNativeResidentBitmapBank} from './pack-resident-bitmap-bank.ts';
import {packOriginalEgaBitmapBank} from './pack-ega-bitmap-bank.ts';
import {acquireCachedResource} from './acquire-cached-resource.ts';
import {selectOriginalBitmapFile} from './select-bitmap-file.ts';
import {loadNativePvsBank} from './load-pvs-bank.ts';
import {convertNativeResidentEgaBitmapBank} from './convert-resident-ega-bank.ts';
import type {NativeOptionalPvsFileHost} from './load-selected-pvs-bank.ts';
/** Original30F52 PVS path: cache-first format selection, native packed-file
 * decoding/unflip, !eg0 colour conversion, release and compaction. PES uses its native planar transpose. Other
 * selected formats require their own source loaders. */
export async function loadOptionalNativeEgaPvsBank(host:NativeOptionalPvsFileHost,d:number,nameOffset:number,framePointer:number){
 const selected=await selectOriginalBitmapFile({memory:()=>host.memory(),cached(at){const result=acquireCachedResource(host.memory(),d,at);host.writeMemory(result.memory);return result.found?{offset:result.offset,segment:result.segment}:null;},exists:at=>host.exists(at)},d,nameOffset,framePointer,{extensionTable:0x5360,filenameDistance:0x78,frameSize:0x7c,cacheBeforeFiles:true});
 if(selected.cached)return selected.cached;
 let extension='';for(let i=0;i<65536;i++){const byte=host.memory()[d+((selected.extension+i)&65535)];if(!byte)break;extension+=String.fromCharCode(byte);}
 const bytes=await host.read(selected.filename);if(!bytes||!bytes.length)return null;
 if(extension==='.PES'){const loaded=loadNativeEgaPesBank(host.memory(),d,selected.filename,bytes);host.writeMemory(loaded.memory);if(loaded.error||!loaded.resource)throw Error('Original PES allocation failed: '+loaded.error);return {offset:0,segment:loaded.segment};}
 if(extension!=='.PVS')throw Error('Original EGA bitmap format requires its own loader: '+extension);
 const source=loadNativePvsBank(host.memory(),d,selected.filename,0x5371,bytes);host.writeMemory(source.memory);if(source.error||!source.resource)throw Error('Original EGA PVS allocation failed: '+source.error);
 const converted=convertNativeResidentEgaBitmapBank(source.memory,d,source.segment,selected.filename);host.writeMemory(converted.memory);if(converted.error||!converted.resource)throw Error('Original EGA conversion failed: '+converted.error);
 return {offset:0,segment:converted.segment};
}

/** Original31604 packs the converted bank after its own basename cache lookup.
 * framePointer is the outer packing frame; the PVS loader is nested20 bytes
 * below it in this executable. */
export async function loadOptionalNativePackedEgaPvsBank(host:NativeOptionalPvsFileHost,d:number,nameOffset:number,framePointer:number){
 const cached=acquireCachedResource(host.memory(),d,nameOffset);host.writeMemory(cached.memory);if(cached.found)return {offset:cached.offset,segment:cached.segment};
 const source=await loadOptionalNativeEgaPvsBank(host,d,nameOffset,(framePointer-20)&65535);if(!source)return null;
 const memory=host.memory(),descriptor=new DataView(memory.buffer,memory.byteOffset,memory.byteLength).getUint16(d+0x4b14,true),packed=packNativeResidentBitmapBank(memory,d,source.segment,descriptor,nameOffset,packOriginalEgaBitmapBank);host.writeMemory(packed.memory);
 if(packed.error||!packed.resource)throw Error('Original packed EGA bitmap allocation failed: '+packed.error);
 return {offset:0,segment:packed.segment};
}
