/** Horizontal road/terrain contact branch from update_player_state.
 * Sloped planes, walls, inverted contact and object collisions require their
 * own branches and are not implemented by this function.
 */
import { i16,vecTransform,type Vector } from './math.ts';
import { rotateZXY } from './rotation.ts';
import { stepSuspension } from './suspension.ts';
export interface WheelSuspension {rc1:number[];rc2:number[];rc4:number[];rc5:number[]}
export function horizontalContact(proposed:Vector[],before:WheelSuspension,rotation:Vector,planes:{height:number;surface:number}[],fps:10|20=20,movement?:{origins:Vector[];alongPlane:Vector[]}){
 const suspension={rc1:[...before.rc1],rc2:[...before.rc2],rc4:[...before.rc4],rc5:[...before.rc5]};
 const orientation=rotateZXY(-rotation[2],-rotation[1],-rotation[0]);
 const surfaces:number[]=[];
 const wheelPositions:Vector[]=[];
 const centres=proposed.map((point,index)=>{
  const p=[...point] as Vector;
  const plane=planes[index];let distance=i16((p[1]>>6)-plane.height);
  if(distance>0){
   for(let step=0;step<(fps===10?2:1);step++){
    suspension.rc1[index]=i16(suspension.rc1[index]+(index<2?21:15));
    p[1]=(p[1]-suspension.rc1[index])|0;
   }
   distance=i16((p[1]>>6)-plane.height);
  }
  surfaces.push(distance>12?0:plane.surface);
  if(distance<0){
   if(movement && ((movement.origins[index][1]>>6)-plane.height)<=0){
    for(let axis=0;axis<3;axis++)p[axis]=(movement.origins[index][axis]+movement.alongPlane[index][axis])|0;
   }
   const penetration=i16((p[1]>>6)-plane.height);
   if(penetration<0)p[1]=(p[1]+i16(-penetration<<6))|0;
  }
  if(distance<=0)suspension.rc1[index]=0;
  // car_whlWorldCrds1 is saved before suspension raises the wheel centres.
  wheelPositions.push(p.map(n=>i16(n>>6)) as Vector);
  const result=stepSuspension({rc2:suspension.rc2[index],rc4:suspension.rc4[index],rc5:suspension.rc5[index]},distance);
  suspension.rc2[index]=result.rc2;suspension.rc4[index]=result.rc4;suspension.rc5[index]=result.rc5;
  const height=i16(result.height+384);
  const offset=rotation[1]||rotation[2]?vecTransform([0,height,0],orientation):[0,height,0];
  return p.map((n,axis)=>(n+offset[axis])|0) as Vector;
 });
 return {centres,suspension,surfaces,wheelPositions};
}

/** build_track_object adds this small checkerboard offset to grass height. */
export function surfaceHeightOffset(surface:number,worldX:number,worldZ:number):number {
 return surface===4?(((i16(worldX)^i16(worldZ))>>8)&1):2;
}
