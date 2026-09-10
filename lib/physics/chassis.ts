/** Wheel geometry and chassis pose reconstruction from update_player_state.
 * Contact/collision and suspension must adjust the proposed wheel locations
 * before reconstructPose is called. This module does not implement contact.
 */
import { i16,intAtan2,vecTransform,type Vector } from './math.ts';
import { rotateX,rotateY,rotateZXY } from './rotation.ts';
export interface ChassisState {position:Vector;rotation:Vector;roadSpeed:number;frontWheelAngle:number;wheelAngle:number;spin:number;allContact:number;suspension:number[]}
export function proposeWheels(s:ChassisState,coordinates:Vector[],fps:10|20=20):Vector[] {
 const [yaw,pitch,roll]=s.rotation;
 const orientation=rotateZXY(-roll,-pitch,-yaw);
 const distance=i16(Math.trunc((s.roadSpeed&65535)*1408/(fps===20?15360:7680)));
 const front=s.allContact?Math.trunc(s.frontWheelAngle/4):0;
 return coordinates.map((coordinate,index)=>{
  let local:Vector=[coordinate[0],i16(-s.suspension[index]-384),coordinate[2]];
  if(s.spin&1023)local=vecTransform(local,rotateY(-s.spin));
  const offset=vecTransform(local,orientation);
  let motion:Vector=[0,0,distance];
  const wheelAngle=i16(s.wheelAngle-(index<2?front:0));
  if(wheelAngle)motion=vecTransform(motion,rotateY(-wheelAngle));
  motion=vecTransform(motion,orientation);
  return offset.map((n,axis)=>(n+s.position[axis]+motion[axis])|0) as Vector;
 });
}
/** Input centres include the contact resolution and suspension height. */
export function reconstructPose(centres:Vector[]):{position:Vector;rotation:Vector} {
 if(centres.length!==4)throw Error('Four wheel centres are required');
 const position=[0,1,2].map(axis=>Math.trunc(centres.reduce((sum,wheel)=>(sum+wheel[axis])|0,0)/4)) as Vector;
 let relative=centres.map(w=>w.map((n,axis)=>i16(n-position[axis])) as Vector);
 position[1]=Math.max(0,position[1]);
 for(const axis of [0,2])position[axis]=position[axis]>0x1df100?0x1df0ff:Math.max(0xf00,position[axis]);
 const difference=(axis:number,a:number,b:number,c:number,d:number)=>i16(relative[a][axis]+relative[b][axis]-relative[c][axis]-relative[d][axis]);
 const yaw=intAtan2(difference(0,3,2,0,1),i16(-difference(2,3,2,0,1)))&1023;
 relative=relative.map(v=>vecTransform(v,rotateY(yaw)));
 let dz=difference(2,3,2,0,1),dy=difference(1,3,2,0,1);
 let pitch=dy===0&&dz<0?0:i16(intAtan2(i16(-dz),dy)-256);
 if(Math.abs(pitch)<2)pitch=0;
 if(pitch)relative=relative.map(v=>vecTransform(v,rotateX(pitch)));
 const dx=difference(0,1,2,0,3);dy=difference(1,1,2,0,3);
 let roll=dy===0&&dx>0?0:i16(intAtan2(dx,dy)-256);
 if(Math.abs(roll)<2)roll=0;
 return {position,rotation:[yaw,pitch,roll]};
}
/** Movement reprojected onto a horizontal contact plane. The original combines
 * the heading before rotating here; doing two rotations changes rounding. */
export function horizontalWheelMotion(s:ChassisState,fps:10|20=20):Vector[] {
 const distance=i16(Math.trunc((s.roadSpeed&65535)*1408/(fps===20?15360:7680)));
 let yaw=s.rotation[0];
 if(s.rotation[1]||s.rotation[2]){
  const world=vecTransform([0,0,distance],rotateZXY(-s.rotation[2],-s.rotation[1],-s.rotation[0]));
  yaw=intAtan2(i16(-world[0]),world[2]);
 }
 const front=s.allContact?Math.trunc(s.frontWheelAngle/4):0;
 return [0,1,2,3].map(index=>vecTransform([0,0,distance],rotateY(-i16(yaw+s.wheelAngle-(index<2?front:0)))));
}
