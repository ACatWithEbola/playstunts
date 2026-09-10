import type {Vector} from '../physics/math.ts';
import type {ModelBoundsCache} from './project-model-bounds.ts';
import {projectOriginalPrimitiveVertices} from './project-primitive-vertices.ts';
import {clipOriginalPolygon} from './clip-original-polygon.ts';
import {originalPolygonVisibility} from './polygon-visibility.ts';
/** Joined supplied 16EF2..17420. The output buffer is retained across polygons:
 * a clipped one/two-point face reads its third point from that retained buffer.
 */
export function projectOriginalPolygonPrimitive(vertices:readonly Vector[],indices:readonly number[],matrix:number[],translation:Vector,halfSize:number,center:readonly number[],scale:readonly number[],rectangle:readonly number[],before:ModelBoundsCache,outputBefore:readonly number[][],primitiveFlags:number,faceMask:number,excludeMask:number,beforeRectangle:readonly number[]){
 const cache=projectOriginalPrimitiveVertices(vertices,indices,matrix,translation,halfSize,center,scale,rectangle,before),output=outputBefore.map(p=>[...p]);
 if(!cache.accepted)return {cache,output,visible:false,rectangle:[...beforeRectangle],depth:null};
 const clipped=clipOriginalPolygon(indices,cache.vectors,cache.points,cache.flags,cache.anyClipped,center,scale,rectangle);
 clipped.points.forEach((p,i)=>{output[i]=p;});
 const visibility=originalPolygonVisibility(clipped.points,clipped.clipCode,primitiveFlags,faceMask,excludeMask,beforeRectangle,output);
 return {cache,output,...visibility,depth:clipped.depth};
}
