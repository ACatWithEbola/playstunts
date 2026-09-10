import {type Vector} from '../physics/math.ts';
import {type ModelBoundsCache} from './project-model-bounds.ts';
import {transformOriginalModelVertex} from './transform-model-vertex.ts';
import {projectOriginalVector} from './project-original-vector.ts';
import {originalProjectedClipCode} from './projected-clip-code.ts';
/** Supplied 16EF2..1706D: reuse model vertex caches across primitive indices. */
export function projectOriginalPrimitiveVertices(vertices:readonly Vector[],indices:readonly number[],matrix:number[],translation:Vector,halfSize:number,center:readonly number[],scale:readonly number[],rectangle:readonly number[],before:ModelBoundsCache){
 const cache={vectors:before.vectors.map(v=>[...v] as Vector),points:before.points.map(p=>[...p]),flags:[...before.flags]};
 let clipCode=15,allBehind=1,anyClipped=0;
 for(const index of indices){
  if(index<0||index>=vertices.length||index>=cache.flags.length)throw Error('Original primitive vertex index outside model');
  if(cache.flags[index]===255){
   const vector=transformOriginalModelVertex(vertices[index],matrix,translation,halfSize);cache.vectors[index]=vector;
   cache.flags[index]=vector[2]<12?1:0;
   if(cache.flags[index]===0)cache.points[index]=projectOriginalVector(vector,center,scale);
  }
  if(cache.flags[index]===1){anyClipped=1;continue;}
  if(cache.flags[index]!==0)continue;
  allBehind=0;if(clipCode)clipCode&=originalProjectedClipCode(cache.points[index],rectangle);
 }
 return {...cache,clipCode,allBehind,anyClipped,accepted:!allBehind&&(clipCode===0||!!anyClipped)};
}
