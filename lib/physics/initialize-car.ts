import {initialCarPose} from './initial-pose.ts';
import {initializeCarFields} from './car-init-fields.ts';
/** Complete supplied-DOS initializer 0x8f7c..0x9176; retain untouched state bytes. */
export function initializeCar(before:Uint8Array,tuning:Uint8Array,transmission:number,position:number[],heading:number){
 const out=initializeCarFields(before,tuning),view=new DataView(out.buffer,out.byteOffset,out.byteLength);
 const pose=initialCarPose(position,heading);
 [...pose.position,...pose.previous].forEach((value,i)=>view.setInt32(i*4,value,true));
 pose.rotation.forEach((value,i)=>view.setInt16(0x18+i*2,value,true));
 for(let wheel=0;wheel<4;wheel++){
  out[0xaa+wheel]=1;
  for(const base of [0x4c,0x54,0x5c,0x64,0x6c])view.setUint16(base+wheel*2,0,true);
 }
 out.fill(0,0xae,0xb4);out[0xb4]=transmission&255;
 out[0xb5]=0;out[0xb6]=0;out[0xb7]=1;
 return out;
}
