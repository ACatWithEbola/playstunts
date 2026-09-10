import {Box3,Ray,Vector3} from 'three';
import type {Vector} from '../physics/math.ts';

/** Presentation-only clearance for the optional chase camera. Actual recovered
 * truck bounds protect both the eye and its sightline; no game state changes.
 */
export function clearChaseTransporter(position:Vector,target:Vector,bounds:Box3,near:number):Vector{
 const expanded=bounds.clone().expandByScalar(near*2),aim=new Vector3(...target);
 const eye=new Vector3(...position),direction=new Vector3(),hit=new Vector3(),ray=new Ray();
 const obstructed=(height:number)=>{
  eye.y=height;direction.copy(eye).sub(aim);const distance=direction.length();
  if(distance===0)return expanded.containsPoint(eye);
  ray.set(aim,direction.divideScalar(distance));
  return expanded.containsPoint(eye)||!!(ray.intersectBox(expanded,hit)&&hit.distanceTo(aim)<distance);
 };
 if(!obstructed(position[1]))return position;
 // An aim point inside the closed truck cannot be made visible without changing
 // the truck. Keep the side camera outside and let the original doors reveal it.
 if(expanded.containsPoint(aim))return position;
 let low=position[1],high=Math.max(low,expanded.max.y)+expanded.getSize(new Vector3()).length();
 for(let i=0;i<8&&obstructed(high);i++)high+=expanded.getSize(new Vector3()).length();
 for(let i=0;i<20;i++){const mid=(low+high)/2;if(obstructed(mid))low=mid;else high=mid;}
 return [position[0],high+near*2,position[2]];
}
