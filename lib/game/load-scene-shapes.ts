import {loadCompleteNativeShapeResource} from './load-shape-resource.ts';
import type {NativeRawResourceHost} from './load-raw-resource.ts';
import {findOriginalResource} from './find-original-resource.ts';
import {initializeOriginalShapeDescriptor} from './initialize-shape-descriptor.ts';
/** Original230F3/2BEBA: total allocatable bytes, including reclaimable cache. */
export function originalAvailableResourceBytes(memory:Uint8Array,d:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(d+(at&65535),true),last=word(0x4b14);
 return ((word(word(0x4b18)+14)-word(last+14)-word(last+12))&65535)*16;
}
/** Original FD52: load GAME1/GAME2 shape banks and resolve 116 scene models. */
export async function loadNativeSceneShapes(host:NativeRawResourceHost&{retry():Promise<number>},d:number,framePointer:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode],middle=mode==='ega'?0x460:high;
 const set=(at:number,value:number)=>{const m=host.memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+at+high,value&65535,true);};
 for(const at of [0xa7d6,0xa7d4,0xa9e4,0xa9e2])set(at,0);
 if(originalAvailableResourceBytes(host.memory(),d)<65000)return 1;
 const first=await loadCompleteNativeShapeResource(host,d,0x2d9a,(framePointer-12)&65535);set(0xa7d4,first.offset);set(0xa7d6,first.segment);
 const second=await loadCompleteNativeShapeResource(host,d,0x2da0,(framePointer-12)&65535);set(0xa9e2,second.offset);set(0xa9e4,second.segment);
 for(let i=0;i<116;i++){
  const name=0x9b8+i*5;
  let pointer=findOriginalResource(host.memory(),d,first.offset,first.segment,name);
  set(0x900e,pointer?.offset??0);set(0x9010,pointer?.segment??0);
  if(!pointer||(pointer.offset|pointer.segment)===0){pointer=findOriginalResource(host.memory(),d,second.offset,second.segment,name,true)!;set(0x900e,pointer.offset);set(0x9010,pointer.segment);}
  initializeOriginalShapeDescriptor(host.memory(),d,pointer.offset,pointer.segment,0x746e+middle+i*22);
 }
 return 0;
}
