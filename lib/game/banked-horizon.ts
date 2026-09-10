import {i16} from '../physics/math.ts';
/** Original E3F8..E461: panorama strips for a shallow bank, after caller clipping. */
export function originalBankedHorizon(top:number,bottom:number,heading:number,horizon:number,delta:number,pixelMask:number,draw:(rectangle:number[],heading:number,horizon:number)=>void,width=320){
 delta=i16(delta);const count=Math.min(Math.abs(delta)+1,32);let left=0;
 for(let i=0;i<count;i++){
  const right=Math.trunc((width*i+width)/count)&pixelMask;
  if(left===right)continue;
  draw([left,right,top,bottom],heading,i16(Math.trunc(delta*i/count)+horizon));left=right;
 }
}
