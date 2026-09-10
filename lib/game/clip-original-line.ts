import {i16,type Vector} from '../physics/math.ts';
import {originalNearPlaneIntersection} from './near-plane-intersection.ts';
import {projectOriginalVector} from './project-original-vector.ts';
/** Supplied 1747C..175A6. Clipped endpoint overwrites projected cache only;
 * original depth wraps the two Z values to a word before sign extension.
 */
export function clipOriginalLine(indices:readonly number[],vectors:readonly Vector[],beforePoints:readonly number[][],flags:readonly number[],center:readonly number[],scale:readonly number[],beforeRectangle:readonly number[]){
 const points=beforePoints.map(p=>[...p]),rectangle=beforeRectangle.map(i16),[a,b]=indices;
 if(flags[a]+flags[b]===2)return {points,rectangle,visible:false,depth:null};
 const back=flags[a]!==0?a:flags[b]!==0?b:null;
 if(back!==null){const front=back===a?b:a;points[back]=projectOriginalVector(originalNearPlaneIntersection(vectors[front],vectors[back]),center,scale);}
 for(const index of [a,b]){const [x,y]=points[index].map(i16);rectangle[0]=Math.min(rectangle[0],x);rectangle[1]=Math.max(rectangle[1],i16(x+1));rectangle[2]=Math.min(rectangle[2],y);rectangle[3]=Math.max(rectangle[3],i16(y+1));}
 return {points,rectangle,visible:true,depth:i16(vectors[a][2]+vectors[b][2])};
}
