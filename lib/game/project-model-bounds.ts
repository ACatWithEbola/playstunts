import {i16,type Vector} from '../physics/math.ts';
import {transformOriginalModelVertex} from './transform-model-vertex.ts';
import {projectOriginalVector} from './project-original-vector.ts';
import {originalProjectedClipCode} from './projected-clip-code.ts';
export interface ModelBoundsCache {vectors:Vector[];points:number[][];flags:number[]}
/** Supplied 16CB2..16E31: first four/eight bounds vertices, early acceptance,
 * near-plane flags and original signed-width fallback. Untouched slots survive.
 */
export function projectOriginalModelBounds(vertices:readonly Vector[],matrix:number[],translation:Vector,halfSize:number,center:readonly number[],scale:readonly number[],rectangle:readonly number[],widthLimit:number,before:ModelBoundsCache){
 const cache={vectors:before.vectors.map(v=>[...v] as Vector),points:before.points.map(p=>[...p]),flags:[...before.flags]};
 let count=Math.min(vertices.length,8);if(count>4&&i16(vertices[0][1])===i16(vertices[4][1]))count=4;
 if(cache.vectors.length<8||cache.points.length<8||cache.flags.length<8)throw Error('Original bounds cache requires eight slots');
 let clipCode=15,allBehind=1,anyClipped=0,cursor=0;
 for(;cursor<count;cursor++){
  const vector=transformOriginalModelVertex(vertices[cursor],matrix,translation,halfSize);cache.vectors[cursor]=vector;
  if(vector[2]<12){cache.flags[cursor]=1;anyClipped=1;continue;}
  allBehind=0;cache.flags[cursor]=0;cache.points[cursor]=projectOriginalVector(vector,center,scale);
  if(clipCode)clipCode&=originalProjectedClipCode(cache.points[cursor],rectangle);
  if(clipCode===0)return {...cache,count,clipCode,allBehind,anyClipped,cursor,accepted:true};
 }
 const accepted=!allBehind&&!!anyClipped&&i16(widthLimit)>=i16(Math.abs(i16(translation[0])));
 return {...cache,count,clipCode,allBehind,anyClipped,cursor,accepted};
}
