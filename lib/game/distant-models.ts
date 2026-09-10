import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
import {i16,vecTransform} from '../physics/math.ts';
import {rotateY,type Matrix} from '../physics/rotation.ts';
/** Original C315..C3EF, entered only at full detail. Retains unused record fields. */
export function submitOriginalDistantModels(memory:Uint8Array,d:number,heading:number,cameraHeight:number,backgroundMatrix:Matrix,draw:(record:number[])=>number,layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),w=(o:number,n:number)=>v.setInt16(d+layout.address(o),n,true),s=(o:number)=>v.getInt16(d+layout.address(o),true);
 w(0x70f2,layout.address(0x9052));w(0x70f4,0);w(0x70f6,0);w(0x70fa,1024);memory[d+layout.address(0x70fc)]=7;memory[d+layout.address(0x70fd)]=0;
 let count=0;
 for(let index=0;index<8;index++){
  const angle=(s(0x622+index*2)+heading+s(0x73da))&1023;
  if(angle>=135&&angle<=889)continue;
  const local=vecTransform([0,i16(2790-cameraHeight),15000],rotateY(angle));
  local[2]=15000;
  const position=vecTransform(local,backgroundMatrix);
  position.forEach((n,i)=>w(0x70ea+i*2,n));
  if(position[2]<=200)continue;
  w(0x70f0,s(0x632+index*2));w(0x70f8,i16(-heading));
  draw(Array.from(memory.subarray(d+layout.address(0x70ea),d+layout.address(0x70fe))));count++;
 }
 return count;
}
