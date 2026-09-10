import {loadOptionalNativeEgaPvsBank,loadOptionalNativePackedEgaPvsBank} from './load-ega-pvs-bank.ts';
import {loadOptionalNativeCgaTandyPvsBank,loadOptionalNativeCompressedCgaTandyPvsBank} from './load-cga-tandy-pvs-bank.ts';
import {dispatchNativeResourceLoad} from './native-resource-dispatch.ts';
import {loadNativeRawResource,type NativeRawResourceHost} from './load-raw-resource.ts';
import {loadNativePackedFileResource} from './load-packed-file-resource.ts';
import {loadOptionalNativePvsBank} from './load-selected-pvs-bank.ts';
import {loadNativeSoundBank} from './load-sound-resource.ts';
export interface NativeResourceFileHost extends NativeRawResourceHost {exists(nameOffset:number):Promise<boolean>;retry():Promise<number>}
/** Original1BCF8 service joined to native file/cache/allocator/codec paths.
 * PVS is supported for bitmap banks; other present historical formats remain
 * explicit unsupported loaders. Missing optional banks return to source retry. */
export function loadNativeResource(host:NativeResourceFileHost,d:number,kind:number,name:number,framePointer:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 return dispatchNativeResourceLoad({memory:()=>host.memory(),retry:()=>host.retry(),load:async(type,at)=>{
  if(type===0||type===1)return loadNativeRawResource(host,d,at);
  if(type===7)return loadNativePackedFileResource(host,d,at);
  if(type===4||type===5||type===6)return loadNativeSoundBank(host,d,type,at,(framePointer-12)&65535,mode);
  const files={memory:()=>host.memory(),writeMemory:(m:Uint8Array)=>host.writeMemory(m),exists:(at:number)=>host.exists(at),read:(at:number)=>host.readFile(at,false)};
  // Alternative packed loaders own their nested 20-byte filename frame.
  const bp=(framePointer-(type===3&&mode==='mcga'?0x2a:type===8?0x1e:0x16))&65535;
  // Kind8 retains indexed sprites even under packed/planar screen drivers.
  if(type===8&&mode!=='mcga')return loadOptionalNativePvsBank(files,d,at,bp,false,{extensionTable:{cga:0x5300,tandy:0x5438,ega:0x53ae}[mode],scratchNameOffset:{cga:0x5321,tandy:0x5459,ega:0x53cf}[mode]});
  if(mode==='ega')return type===3?loadOptionalNativePackedEgaPvsBank(files,d,at,bp):loadOptionalNativeEgaPvsBank(files,d,at,bp);
  if(mode==='cga'||mode==='tandy')return type===3?loadOptionalNativeCompressedCgaTandyPvsBank(files,d,mode,at,bp):loadOptionalNativeCgaTandyPvsBank(files,d,mode,at,bp);
  return loadOptionalNativePvsBank(files,d,at,bp,type===3);
 }},d,kind,name,framePointer);
}
