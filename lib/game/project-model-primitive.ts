import {i16,type Vector} from '../physics/math.ts';
import type {ModelBoundsCache} from './project-model-bounds.ts';
import {projectOriginalPrimitiveVertices} from './project-primitive-vertices.ts';
import {clipOriginalPolygon} from './clip-original-polygon.ts';
import {originalPolygonVisibility} from './polygon-visibility.ts';
import {clipOriginalLine} from './clip-original-line.ts';
import {projectOriginalCircle} from './project-original-circle.ts';
import {originalWheelProjection} from './wheel-projection.ts';
import {originalWheelProjectionBounds} from './wheel-projection-bounds.ts';
/** Original DS3280 dispatch. Kind4 is skipped by the supplied executable. */
export function projectOriginalModelPrimitive(kind:number,vertices:readonly Vector[],indices:readonly number[],matrix:number[],translation:Vector,halfSize:number,center:readonly number[],scale:readonly number[],clipRectangle:readonly number[],before:ModelBoundsCache,outputBefore:readonly number[][],primitiveFlags:number,faceMask:number,excludeMask:number,beforeRectangle:readonly number[]){
 const cache=projectOriginalPrimitiveVertices(vertices,indices,matrix,translation,halfSize,center,scale,clipRectangle,before),output=outputBefore.map(p=>[...p]);
 let rectangle=[...beforeRectangle],visible=false,depth:number|null=null,count=indices.length;
 if(cache.accepted){
  if(kind===0){
   const clipped=clipOriginalPolygon(indices,cache.vectors,cache.points,cache.flags,cache.anyClipped,center,scale,clipRectangle);
   clipped.points.forEach((p,i)=>{output[i]=p;});count=clipped.points.length;depth=clipped.depth;
   ({visible,rectangle}=originalPolygonVisibility(clipped.points,clipped.clipCode,primitiveFlags,faceMask,excludeMask,rectangle,output));
  }else if(kind===1){
   const line=clipOriginalLine(indices,cache.vectors,cache.points,cache.flags,center,scale,rectangle);
   cache.points=line.points;({visible,rectangle,depth}=line);
   if(visible){indices.forEach((index,i)=>{output[i]=[...cache.points[index]];});count=2;}
  }else if(kind===2){
   const circle=projectOriginalCircle(indices.map(i=>cache.vectors[i]),cache.points[indices[0]],indices.map(i=>cache.flags[i]),scale[0],rectangle);
   ({visible,rectangle,depth}=circle);
   if(visible){output[0]=[...cache.points[indices[0]]];output[1][0]=circle.radius!;count=2;}
  }else if(kind===3){
   const wheel=originalWheelProjection(indices.map(i=>cache.points[i]),indices.map(i=>cache.vectors[i][2]),cache.anyClipped);
   if(wheel){wheel.points.forEach((p,i)=>{output[i]=p;});depth=wheel.depth;rectangle=originalWheelProjectionBounds(wheel.points,rectangle).rectangle;visible=true;count=4;}
  }else if(kind===5&&cache.flags[indices[0]]===0){
   const index=indices[0],[x,y]=cache.points[index].map(i16);output[0]=[x,y];depth=i16(cache.vectors[index][2]);count=1;visible=true;
   rectangle=[Math.min(rectangle[0],x),Math.max(rectangle[1],i16(x+1)),Math.min(rectangle[2],y),Math.max(rectangle[3],i16(y+1))];
  }
 }
 return {cache,output,visible,rectangle,depth,count};
}
