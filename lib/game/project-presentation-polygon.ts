import type {Vector} from '../physics/math.ts';
import {originalNearPlaneIntersection} from './near-plane-intersection.ts';

/** Presentation projection of an already source-transformed polygon. Keep the
 * original near plane and intersection rule, but retain fractional screen
 * coordinates for the higher-resolution renderer. This does not decide source
 * visibility, depth order, materials, or simulation state.
 */
export function projectPresentationPolygon(vectors:readonly Vector[],center:readonly number[],scale:readonly number[]):number[][]{
 if(!vectors.length)return [];
 const points:number[][]=[];
 const append=(v:Vector)=>points.push([center[0]+v[0]*scale[0]/v[2],center[1]-v[1]*scale[1]/v[2]]);
 let previous=vectors[vectors.length-1];
 for(const current of vectors){
  const front=current[2]>=12,wasFront=previous[2]>=12;
  if(front!==wasFront)append(originalNearPlaneIntersection(front?current:previous,front?previous:current));
  if(front)append(current);
  previous=current;
 }
 return points;
}
