import {i16} from '../physics/math.ts';
/** Supplied 17AE2..17B2D: inclusive clip edges, top/bottom bits 1/2 and
 * left/right bits 4/8. Earlier branches retain priority for reversed bounds.
 */
export function originalProjectedClipCode(point:readonly number[],rectangle:readonly number[]){
 const x=i16(point[0]),y=i16(point[1]),[left,right,top,bottom]=rectangle.map(i16);
 return (y<top?1:y>bottom?2:0)|(x<left?4:x>right?8:0);
}
