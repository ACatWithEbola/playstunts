import {buildOriginalSoundResourceFilename} from './sound-resource-filename.ts';
import {loadNativeRawResource,type NativeRawResourceHost} from './load-raw-resource.ts';
import {loadNativePackedFileResource} from './load-packed-file-resource.ts';
/** Original298E6: driver-prefixed, generic-prefixed, unprefixed and literal
 * name fallbacks, alternating raw and packed resource loading. */
export async function loadNativeSoundResource(host:NativeRawResourceHost,d:number,name:number,extension:number,prefix:number,framePointer:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const u=(n:number)=>n&65535,packedExtension=u(framePointer-8);
 const save=(pointer:{offset:number;segment:number}|null)=>{const m=host.memory(),v=new DataView(m.buffer,m.byteOffset,m.byteLength);v.setUint16(d+u(framePointer-4),pointer?.offset??0,true);v.setUint16(d+u(framePointer-2),pointer?.segment??0,true);return pointer&&(pointer.offset||pointer.segment)?pointer:null;};
 const attempt=async(ext:number,pre:number,packed:boolean)=>{const at=buildOriginalSoundResourceFilename(host.memory(),d,name,ext,pre,mode);return save(await (packed?loadNativePackedFileResource(host,d,at):loadNativeRawResource(host,d,at)));};
 let pointer=await attempt(extension,prefix,false);if(pointer)return pointer;
 host.memory()[d+packedExtension]=80;host.memory()[d+u(packedExtension+1)]=host.memory()[d+u(extension)];host.memory()[d+u(packedExtension+2)]=host.memory()[d+u(extension+1)];host.memory()[d+u(packedExtension+3)]=0;
 for(const [ext,pre,packed] of [[packedExtension,prefix,true],[extension,0x4e1c,false],[packedExtension,0x4e1f,true],[extension,0x4e22,false],[packedExtension,0x4e23,true]] as const){pointer=await attempt(ext,pre,packed);if(pointer)return pointer;}
 return save(await loadNativeRawResource(host,d,name));
}
/** Original29A0A/29A62/29A8A resource-type entry points. */
export async function loadNativeSoundBank(host:NativeRawResourceHost,d:number,kind:4|5|6,name:number,framePointer:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const set=(pointer:{offset:number;segment:number}|null)=>{const m=host.memory(),v=new DataView(m.buffer,m.byteOffset,m.byteLength);v.setUint16(d+((framePointer-4)&65535),pointer?.offset??0,true);v.setUint16(d+((framePointer-2)&65535),pointer?.segment??0,true);return pointer;};
 set(null);
 const load=(extension:number)=>loadNativeSoundResource(host,d,name,extension,0x7460+{mcga:0,cga:0x5e0,tandy:0x620,ega:0x460}[mode],(framePointer-16)&65535,mode);
 if(kind===4)return set(await load(0x4e2c));
 if(host.memory()[d+0x4e07]){const pointer=set(await load(kind===5?0x4e30:0x4e24));if(pointer&&(pointer.offset||pointer.segment))return pointer;}
 return set(await load(kind===5?0x4e34:0x4e28));
}
