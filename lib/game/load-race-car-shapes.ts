import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import {loadCompleteNativeShapeResource} from './load-shape-resource.ts';
import type {NativeRawResourceHost} from './load-raw-resource.ts';
import {allocateResourcePages} from './allocate-resource-pages.ts';
import {initializeCarRenderBank} from './initialize-same-car-render-bank.ts';
/** Original FE4E: load original car models, construct shape descriptors and
 * wheel data, and give an identical opponent its own mutable allocation. */
export async function loadNativeRaceCarShapes(host:NativeRawResourceHost&{retry():Promise<number>},d:number,playerName:number,opponentName:number,framePointer:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const layout=WORLD_DISPLAY_LAYOUTS[mode];
 const word=(at:number)=>{const m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(d+(at&65535),true);};
 const set=(at:number,value:number)=>{const m=host.memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+(layout.address(at)&65535),value&65535,true);};
 const load=async(name:number,opponent:boolean)=>{
  for(let i=0;i<4;i++)host.memory()[d+0x2df4+i]=host.memory()[d+((name+i)&65535)];
  const pointer=await loadCompleteNativeShapeResource(host,d,0x2df2,(framePointer-0x1c)&65535);
  const at=opponent?0x9ac2:0x9abc;set(at,pointer.offset);set(at+2,pointer.segment);
  initializeCarRenderBank(host.memory(),d,pointer.offset,pointer.segment,opponent,layout);
 };
 await load(playerName,false);
 if(host.memory()[d+(opponentName&65535)]===255){set(0x9ac2,0);set(0x9ac4,0);return;}
 const equal=Array.from({length:4},(_,i)=>host.memory()[d+((playerName+i)&65535)]===host.memory()[d+((opponentName+i)&65535)]).every(Boolean);
 if(!equal){await load(opponentName,true);return;}
 const sourceOffset=word(layout.address(0x9abc)),sourceSegment=word(layout.address(0x9abe)),first=word(0x4b12);let descriptor=word(0x4b14);
 for(let guard=0;;guard++){
  if(descriptor===first)throw Error('Original car model allocation is missing');
  if(word(descriptor+14)===sourceSegment)break;
  if(guard>=3641)throw Error('Original car model allocation chain is not bounded');descriptor=(descriptor-18)&65535;
 }
 const pages=word(descriptor+12),size=pages*16;
 // The byte allocator adds a paragraph even for an exact paragraph-sized copy.
 const allocated=allocateResourcePages(host.memory(),d,0x2dc9,(pages+1)&65535);host.writeMemory(allocated.memory);
 if(allocated.error)throw Error('Original opponent car allocation failed: '+allocated.error);
 set(0x9ac2,allocated.offset);set(0x9ac4,allocated.segment);
 for(let i=0;i<size;i++)host.memory()[allocated.segment*16+((allocated.offset+i)&65535)]=host.memory()[sourceSegment*16+((sourceOffset+i)&65535)];
 initializeCarRenderBank(host.memory(),d,allocated.offset,allocated.segment,true,layout);
}
