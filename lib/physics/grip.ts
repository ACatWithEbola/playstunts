/** Reconstructed update_grip from the recovered assembly.
 * Surface IDs and all inputs refer to the previous contact calculation.
 * Player=true follows player_op's final argument of 1 (the recovered assembly's
 * arg_isOpponent label is misleading). Track tiles are supplied by the caller.
 */
import { i16,u16,intCos } from './math.ts';
export interface GripState {
 speed:number;roadSpeed:number;steeringAngle:number;wheelAngle:number;
 spin:number;frontWheelAngle:number;slip:number;demandedGrip:number;surfaceGrip:number;
 allContact:number;surfaces:number[];sliding:number;crash:number;soundFlags:number;
 yaw:number;roll:number;
}
export interface GripTuning {grip:number;surfaceGrip:number[]}
export function stepGrip(before:GripState,t:GripTuning,player=true,trackElement=0,onContactScratch?:(words:[number,number])=>void):GripState {
 const s={...before,surfaces:[...before.surfaces]};
 if(!s.allContact){s.frontWheelAngle=0;s.sliding=0;return s}
 // Original grounded grip leaves the divisor in the later contact stack.
 onContactScratch?.([1024,0]);
 const grass=s.surfaces.filter(x=>x===4).length;
 if(grass){s.roadSpeed=u16(s.roadSpeed-Math.floor(u16(s.roadSpeed)/[255,256,192,128,64][grass]));s.speed=s.roadSpeed}
 const initial=i16(s.steeringAngle+s.wheelAngle);let angle=initial;
 const mph=u16(s.speed)>>>8;
 const demand=i16(((mph*mph&65535)>>>6)*(i16(Math.abs(initial))>>3));
 const sum=i16(s.surfaces.reduce((sum,id)=>sum+t.surfaceGrip[id],0));
 const combined=i16(Math.trunc(i16(t.grip*2)*sum/1024));
 s.demandedGrip=demand;s.surfaceGrip=combined;
 if(player){
  if(!s.steeringAngle){const small=(s.yaw<<24)>>24;if(small && Math.abs(small)<8)s.yaw=i16(s.yaw-Math.sign(small))}
  if(demand>combined){
   s.sliding=1;
   angle=i16(Math.trunc(combined*256/(mph*mph)));
   if(initial<0)angle=i16(-angle);
   // This executable divides toward zero (0x189cb), unlike the later
   // reference assembly which uses arithmetic shifts for negative values.
   angle=i16(Math.trunc(i16(i16(angle*3)+initial)/4));
   s.slip=i16(initial-angle);
  }else{
   s.sliding=0;
   if(s.slip){s.slip=i16(s.slip-Math.trunc(s.slip/16));if(Math.abs(s.slip)<16)s.slip=Math.trunc(s.slip/2)}
  }
  s.frontWheelAngle=(!s.spin && s.crash!==1)?angle:0;
  if(Math.abs(s.roll)>4 && trackElement>=0x34 && trackElement<=0x37)s.frontWheelAngle=i16(s.frontWheelAngle+Math.trunc(s.roll/5));
  if(i16(combined+1000)<demand){s.spin=i16(Math.trunc(i16(s.spin+Math.trunc(i16(angle-initial)/14))/2))}
  else if(s.spin){
   s.spin=i16(Math.trunc(i16(s.spin+Math.trunc(i16(angle-initial)/14))/2));
   if(!s.spin){onContactScratch?.([0x187a,s.wheelAngle]);const cosine=intCos(s.wheelAngle);s.roadSpeed=cosine<0?0:u16((i16(s.roadSpeed)*cosine+8192)>>14);s.wheelAngle=0}
  }
 }else{
  s.frontWheelAngle=i16(s.steeringAngle*4);
  if(s.spin)s.spin=Math.trunc(i16(s.spin*15)/16);
 }
 if(s.wheelAngle && !s.spin)s.wheelAngle=Math.trunc(i16(s.wheelAngle*15)/16);
 if(s.spin)s.wheelAngle=i16(s.wheelAngle-s.spin);
 if(s.sliding){
  const loss=u16(Math.abs(i16(s.slip*2)));
  if(u16(s.speed)>loss){
   if(u16(s.roadSpeed)>loss){s.speed=u16(s.speed-loss);s.roadSpeed=u16(s.roadSpeed-loss)}else{s.speed=0;s.roadSpeed=0}
   s.soundFlags|=s.surfaces.includes(1)?2:4;
  }else{s.speed=0;s.roadSpeed=0}
 }
 s.slip=0;
 return s;
}
