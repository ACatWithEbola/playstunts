import {i16,intAtan2,intCos,intSin,vecTransform,type Vector} from './math.ts';
import {opponentPose} from './opponent-pose.ts';
/** Original 0x737a..0x7492/0x74a1, before the finish-event call. */
export function opponentPostMove(position:Vector,rotation:Vector,midpoint:Vector,crash:number,completed:number,previousAngle:number,startX:number,startZ:number,startAngle:number){
 const pose=opponentPose(position,position,rotation);
 let angle=previousAngle&65535;
 if(!(crash&255)){
  const local=vecTransform(midpoint.map((v,i)=>i16(v-pose.position[i])) as Vector,pose.matrix);
  angle=intAtan2(i16(-local[0]),local[2])&1023;
 }
 const product=(value:number,trig:number)=>i16((Math.imul(value,trig)+8192)>>14);
 const crossing=i16(product(i16(startZ-pose.position[2]),intCos(startAngle))+product(i16(startX-pose.position[0]),intSin(startAngle)));
 return {angle,finish:!!(completed&255)&&crossing<0};
}
