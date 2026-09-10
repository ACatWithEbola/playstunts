import {i16,intAtan2,intCos,intSin,vecTransform,type Vector} from './math.ts';
import {opponentPose} from './opponent-pose.ts';
export interface PlayerPostMoveState {position:Vector;rotation:Vector;target:Vector;routeIndex:number;routeStatus:number;crash:number;laps:number;angle:number;warning:number;wheelAngle:number}
/** Original 9cc5..9e3c before dispatching player finish event 3. */
export function playerPostMove(before:PlayerPostMoveState,startX:number,startZ:number,startAngle:number){
 let angle=before.angle&65535,warning=before.warning&255;
 const pose=opponentPose(before.position,before.position,before.rotation);
 if((before.routeIndex&65535)!==65535&&(before.routeStatus&255)===0){
  const relative=before.target.map((v,i)=>i===1&&v===-1?0:i16(v-pose.position[i])) as Vector;
  const local=vecTransform(relative,pose.matrix);
  angle=intAtan2(i16(-local[0]),local[2])&1023;
  if(!(before.crash&255)){
   const quadrant=((angle+128)&1023)>>>8;
   warning=quadrant===1?1:quadrant===3&&(before.wheelAngle&65535)===0?2:0;
  }
 }
 const product=(value:number,trig:number)=>i16((Math.imul(value,trig)+8192)>>14);
 const crossing=i16(product(i16(startZ-pose.position[2]),intCos(startAngle))+product(i16(startX-pose.position[0]),intSin(startAngle)));
 return {angle,warning,finish:!!(before.laps&255)&&crossing<0};
}
