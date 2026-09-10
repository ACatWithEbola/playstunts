import {i16,type Vector} from '../physics/math.ts';
import {originalNearPlaneIntersection} from './near-plane-intersection.ts';
import {projectOriginalVector} from './project-original-vector.ts';
import {originalProjectedClipCode} from './projected-clip-code.ts';
/** Supplied 1709A..17343: near-plane clipping with source duplicate suppression.
 * Depth is the sum of original vertices, including those behind the plane.
 */
export function clipOriginalPolygon(indices:readonly number[],vectors:readonly Vector[],points:readonly number[][],flags:readonly number[],anyClipped:number,center:readonly number[],scale:readonly number[],rectangle:readonly number[]){
 const output:number[][]=[];let depth=0,clipCode=15;
 const append=(point:readonly number[])=>{output.push([...point]);if(clipCode)clipCode&=originalProjectedClipCode(point,rectangle);};
 let previous=indices[indices.length-1];
 for(const index of indices){
  depth=(depth+i16(vectors[index][2]))|0;
  if(!anyClipped){append(points[index]);continue;}
  const visible=flags[index]===0,wasVisible=flags[previous]===0;
  if(visible!==wasVisible){
   const front=visible?index:previous,back=visible?previous:index;
   const intersection=projectOriginalVector(originalNearPlaneIntersection(vectors[front],vectors[back]),center,scale);
   if(intersection[0]!==points[front][0]||intersection[1]!==points[front][1])append(intersection);
  }
  if(visible)append(points[index]);previous=index;
 }
 return {points:output,depth,clipCode};
}
