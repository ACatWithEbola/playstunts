import {Matrix4,Vector3} from 'three';
import {continuousNearClippedPolygon,continuousPolygonFacing} from './continuous-polygon-facing.ts';
import type {Vector} from '../physics/math.ts';
import type {Shape} from './types.ts';
/** Source primitive flags and attached-group semantics, with facing/clipping
 * evaluated in the actual GPU camera space. Direction masks remain inputs
 * recovered from the original model setup; they are not regenerated here.
 */
export function continuousModelVisibility(shape:Shape,include:readonly number[],exclude:readonly number[],includeMask:number,excludeMask:number,modelView:Matrix4,near:number,visible:boolean[]){
 const point=new Vector3();
 const vertices=shape.vertices.map(v=>{point.set(v[0],v[1],v[2]).applyMatrix4(modelView);return [point.x,point.y,-point.z] as Vector;});
 let rejectedParent=false;
 for(let i=0;i<shape.primitives.length;i++){
  const primitive=shape.primitives[i],attached=!!(primitive.flags&2);
  if(attached&&rejectedParent){visible[i]=false;continue;}
  let accepted=false;
  if((include[i]&includeMask)!==0){
   const points=primitive.indices.map(index=>vertices[index]);
   if(primitive.type>=3&&primitive.type<=10){
    const clipped=continuousNearClippedPolygon(points,near);
    accepted=clipped.length>=3&&!!((primitive.flags&1)||(exclude[i]&excludeMask)||continuousPolygonFacing(clipped));
   }else accepted=points.some(p=>p[2]>=near);
  }
  visible[i]=accepted;
  if(!attached)rejectedParent=!accepted;
 }
}
