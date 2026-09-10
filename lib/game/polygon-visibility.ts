import {i16} from '../physics/math.ts';
import {originalProjectedFaceVisible} from './projected-face-visible.ts';
/** Supplied 17344..17420: source material/mask override, facing and dirty bounds. */
export function originalPolygonVisibility(points:readonly (readonly number[])[],clipCode:number,flags:number,faceMask:number,excludeMask:number,before:readonly number[],facingPoints:readonly (readonly number[])[]=points){
 const rectangle=before.map(i16);
 const visible=points.length!==0&&(clipCode&255)===0&&!!((flags&1)||((faceMask&excludeMask)!==0)||originalProjectedFaceVisible(facingPoints));
 if(visible)for(const point of points){
  const x=i16(point[0]),y=i16(point[1]);
  rectangle[0]=Math.min(rectangle[0],x);rectangle[1]=Math.max(rectangle[1],i16(x+1));
  rectangle[2]=Math.min(rectangle[2],y);rectangle[3]=Math.max(rectangle[3],i16(y+1));
 }
 return {visible,rectangle};
}
