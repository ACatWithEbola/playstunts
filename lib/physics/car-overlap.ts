import {i16,vecTransform,type Vector} from './math.ts';
import {rotateZXY} from './rotation.ts';
import {carsNear} from './car-proximity.ts';
export interface CollisionBody{position:Vector;angles:Vector;dimensions:Vector;radius:number}
/** Original0xae4a: tests four base corners in each direction, not a generic box intersection. */
export function carsOverlap(a:CollisionBody,b:CollisionBody){
 if(!carsNear(a.position,b.position,a.radius,b.radius))return false;
 const inside=(source:CollisionBody,target:CollisionBody)=>{
  const world=rotateZXY(...source.angles.map(v=>i16(-v)) as Vector);
  const local=rotateZXY(...target.angles,true);
  for(const sx of [-1,1])for(const sz of [-1,1]){
   const corner=vecTransform([sx*source.dimensions[0],0,sz*source.dimensions[2]],world).map((v,i)=>i16(v+source.position[i]));
   const p=vecTransform(target.position.map((v,i)=>i16(v-corner[i])) as Vector,local);
   if(p[1]>=0&&p[1]<=target.dimensions[1]&&p[0]>=-target.dimensions[0]&&p[0]<=target.dimensions[0]&&p[2]>=-target.dimensions[2]&&p[2]<=target.dimensions[2])return true;
  }
  return false;
 };
 return inside(a,b)||inside(b,a);
}
