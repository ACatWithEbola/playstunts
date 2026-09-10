import {loadOptionalNativeEgaPvsBank,loadOptionalNativePackedEgaPvsBank} from './load-ega-pvs-bank.ts';
import {loadOptionalNativeCgaTandyPvsBank,loadOptionalNativeCompressedCgaTandyPvsBank} from './load-cga-tandy-pvs-bank.ts';
import {acquireCachedResource} from './acquire-cached-resource.ts';
import {selectOriginalBitmapFile} from './select-bitmap-file.ts';
import {loadNativePvsBank} from './load-pvs-bank.ts';
import {packNativeResidentBitmapBank} from './pack-resident-bitmap-bank.ts';
export interface NativePvsFileHost {
 memory():Uint8Array;writeMemory(memory:Uint8Array):void;
 exists(nameOffset:number):Promise<boolean>;
 read(nameOffset:number):Promise<Uint8Array>;
}
/** Original filename/cache selection joined to the supplied PVS loading path.
 * The frame pointer belongs to2c432, including when nested inside2c734.
 * Other historical bitmap formats require their own loaders. */
export async function loadSelectedNativePvsBank(host:NativePvsFileHost,d:number,nameOffset:number,framePointer:number,packedBitmap:boolean,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const pointer=await (mode==='mcga'?loadOptionalNativePvsBank(host,d,nameOffset,framePointer,packedBitmap):mode==='ega'?(packedBitmap?loadOptionalNativePackedEgaPvsBank(host,d,nameOffset,framePointer):loadOptionalNativeEgaPvsBank(host,d,nameOffset,framePointer)):(packedBitmap?loadOptionalNativeCompressedCgaTandyPvsBank(host,d,mode,nameOffset,framePointer):loadOptionalNativeCgaTandyPvsBank(host,d,mode,nameOffset,framePointer)));
 if(!pointer)throw Error('Original bitmap resource is unavailable');return pointer;
}
export interface NativeOptionalPvsFileHost extends Omit<NativePvsFileHost,'read'> {read(nameOffset:number):Promise<Uint8Array|null>}
/** Optional entry for the original resource service's retry/cancellation loop. */
export async function loadOptionalNativePvsBank(host:NativeOptionalPvsFileHost,d:number,nameOffset:number,framePointer:number,packedBitmap:boolean,layout={extensionTable:0x5290,scratchNameOffset:0x52b1}){
 const cache=(at:number)=>{
  const result=acquireCachedResource(host.memory(),d,at);host.writeMemory(result.memory);
  return result.found?{offset:result.offset,segment:result.segment}:null;
 };
 if(packedBitmap){const cached=cache(nameOffset);if(cached)return cached;}
 const selected=await selectOriginalBitmapFile({memory:()=>host.memory(),cached:cache,exists:at=>host.exists(at)},d,nameOffset,framePointer,{extensionTable:layout.extensionTable,filenameDistance:0x7c,frameSize:0x80,cacheBeforeFiles:false});
 let source=selected.cached;
 if(!source){
  let extension='';for(let i=0;i<65536;i++){const value=host.memory()[d+((selected.extension+i)&65535)];if(!value)break;extension+=String.fromCharCode(value);}
  const bytes=await host.read(selected.filename);if(!bytes||bytes.length===0)return null;
  if(extension!=='.PVS')throw Error('Original bitmap format requires its own loader: '+extension);
  const loaded=loadNativePvsBank(host.memory(),d,selected.filename,layout.scratchNameOffset,bytes);host.writeMemory(loaded.memory);
  if(loaded.error||!loaded.resource)throw Error('Original PVS allocation failed: '+loaded.error);
  source={offset:0,segment:loaded.segment};
 }
 if(!packedBitmap)return source;
 const m=host.memory(),descriptor=new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(d+0x4b14,true);
 const result=packNativeResidentBitmapBank(m,d,source.segment,descriptor,nameOffset);host.writeMemory(result.memory);
 if(result.error||!result.resource)throw Error('Original packed bitmap allocation failed: '+result.error);
 return {offset:0,segment:result.segment};
}
