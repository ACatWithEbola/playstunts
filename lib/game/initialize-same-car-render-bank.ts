import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
import {initializeOriginalShapeDescriptor} from './initialize-shape-descriptor.ts';
import {initializeOriginalCarWheels} from './initialize-car-wheels.ts';
import type {Vector} from '../physics/math.ts';

/** Supplied FE4E..102ED same-car branch, from an already loaded 3D bank.
 * The rendering caller reserves a separate destination for the opponent bank;
 * original wheel deformation must never share the player's mutable vertices.
 */
export function initializeSameCarRenderBank(memory:Uint8Array,d:number,destinationSegment:number,layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const word=(o:number)=>v.getUint16(d+layout.address(o),true),set=(o:number,n:number)=>v.setUint16(d+layout.address(o),n&65535,true);
 const sourceOffset=word(0x9abc),sourceSegment=word(0x9abe),source=sourceSegment*16+sourceOffset,size=v.getUint32(source,true),destination=destinationSegment*16;
 if(!size||size>65535||source+size>memory.length||destination+size>memory.length||destination<source+size&&destination+size>source)throw Error('Invalid independent original car bank allocation');
 memory.copyWithin(destination,source,source+size);set(0x9ac2,0);set(0x9ac4,destinationSegment);
 initializeCarRenderBank(memory,d,sourceOffset,sourceSegment,false,layout);initializeCarRenderBank(memory,d,0,destinationSegment,true,layout);
 return size;
}

/** Original descriptor and wheel setup, shared by equal and distinct cars. */
export function initializeCarRenderBank(memory:Uint8Array,d:number,offset:number,segment:number,opponent:boolean,layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const word=(o:number)=>v.getUint16(d+layout.address(o),true),set=(o:number,n:number)=>v.setUint16(d+layout.address(o),n&65535,true);
  const base=segment*16+offset,count=v.getUint16(base+4,true),payload=6+count*8;
  const descriptors=opponent?[0x7f2c,0x7f58,0x7f84,0x7ebe,0x7ed4,0x7eea,0x7f00]:[0x7f16,0x7f42,0x7f6e,0x7e66,0x7e7c,0x7e92,0x7ea8];
  const names=['car0','car1','car2','exp0','exp1','exp2','exp3'];
  names.forEach((name,i)=>{
   let index=-1;for(let j=0;j<count;j++)if(name.split('').every((c,k)=>memory[base+6+j*4+k]===c.charCodeAt(0))){index=j;break;}
   if(index<0)throw Error(`Original car shape missing: ${name}`);
   const resourceOffset=(offset+payload+v.getUint32(base+6+count*4+index*4,true))&65535;
   const at=resourceOffset&15,resourceSegment=segment+(resourceOffset>>>4);
   initializeOriginalShapeDescriptor(memory,d,at,resourceSegment,layout.address(descriptors[i]));
  });
  const descriptor=descriptors[1],at=word(descriptor+4)*16+word(descriptor+2)+48;
  const centersAt=opponent?0x73b4:0x736a,baseAt=opponent?0x8f16:0x8a4c,cacheAt=opponent?0x8adc:0x8a3a;
  const readVectors=(at:number,count:number)=>Array.from({length:count},(_,i)=>[0,1,2].map(a=>v.getInt16(at+i*6+a*2,true)) as Vector);
  const wheel=initializeOriginalCarWheels(readVectors(at,24),readVectors(d+layout.address(centersAt),2));
  wheel.centers.flat().forEach((n,i)=>v.setUint16(d+layout.address(centersAt)+i*2,n&65535,true));wheel.base.flat().forEach((n,i)=>v.setUint16(d+layout.address(baseAt)+i*2,n&65535,true));wheel.cache.forEach((n,i)=>v.setUint16(d+layout.address(cacheAt)+i*2,n&65535,true));
}
