import {i16} from '../physics/math.ts';
/** Supplied 17B2E..17BF5. X differences retain 32 bits, whereas Y
 * differences wrap as words before the original 32-bit cross product.
 */
export function originalProjectedFaceVisible(points:readonly (readonly number[])[]):boolean{
 if(points.length<3)throw Error('Original facing check requires three projected points');
 const dx0=i16(points[0][0])-i16(points[1][0]),dx2=i16(points[2][0])-i16(points[1][0]);
 const dy0=i16(points[0][1]-points[1][1]),dy2=i16(points[2][1]-points[1][1]);
 return ((Math.imul(dx2,dy0)-Math.imul(dx0,dy2))|0)>0;
}
