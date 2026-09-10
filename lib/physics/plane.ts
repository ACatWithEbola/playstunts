/** Collision-plane math recovered from plane_origin_op / plane_rotate_op.
 * Positions use original world units; normals use Q13 and rotations Q14.
 */
import { i16,intAtan2,vecTransform,type Vector } from './math.ts';
import { rotateY,rotateZXY,transpose,type Matrix } from './rotation.ts';
export interface CollisionPlane {id:number;roll:number;pitch:number;origin:Vector;normal:Vector;rotation:Matrix}
export function normalProduct(vector:Vector,normal:Vector):number {
 const dot=(Math.imul(i16(vector[0]),i16(normal[0]))+Math.imul(i16(vector[2]),i16(normal[2]))+Math.imul(i16(vector[1]),i16(normal[1])))|0;
 return i16(Math.trunc(dot/8192));
}
export function planeDistance(point:Vector,plane:CollisionPlane,tileOrigin:Vector):number {
 const relative=point.map((n,axis)=>i16(n-plane.origin[axis]-tileOrigin[axis])) as Vector;
 return plane.id<4?relative[1]:normalProduct(relative,plane.normal);
}
export function planeMovement(distance:number,wheelAngle:number,carRotation:Vector,plane:CollisionPlane):Vector {
 const vector:Vector=[0,0,i16(distance)];
 let heading=carRotation[0];
 if(plane.pitch!==carRotation[1] || plane.roll!==carRotation[2]){
  const world=vecTransform(vector,rotateZXY(-carRotation[2],-carRotation[1],-carRotation[0]));
  const local=vecTransform(world,transpose(plane.rotation));
  heading=intAtan2(i16(-local[0]),local[2]);
 }
 const angle=i16(heading+wheelAngle);
 return vecTransform(angle?vecTransform(vector,rotateY(-angle)):vector,plane.rotation);
}
