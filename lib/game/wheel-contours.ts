import {i16} from '../physics/math.ts';
const mul=(a:number,b:number)=>i16((Math.imul(i16(a),i16(b))+8192)>>14);
/** Supplied 2807A..28245. Keep the original 16-point ellipse construction,
 * including its arithmetic halves and fixed constants, rather than resampling.
 */
export function originalEllipseContour(points:readonly (readonly number[])[]){
 if(points.length<3)throw Error('Original ellipse requires a center and two axis points');
 const offsets=Array.from({length:8},()=>[0,0]);
 for(let axis=0;axis<2;axis++){
  const a=i16(points[1][axis]-points[0][axis]),b=i16(points[2][axis]-points[0][axis]);
  const values=[a,mul(i16(a+(b>>1)),0x393e),mul(i16(a+b),0x2d41),mul(i16(b+(a>>1)),0x393e),b,mul(i16(b-(a>>1)),0x393e),mul(i16(b-a),0x2d41),mul(i16(-a+(b>>1)),0x393e)];
  values.forEach((n,i)=>offsets[i][axis]=n);
 }
 return [...offsets.map(p=>p.map((n,a)=>i16(points[0][a]+n))),...offsets.map(p=>p.map((n,a)=>i16(points[0][a]-n)))];
}
/** Supplied 2894A..289F0 and 28CF4..28D5C. Front outer/inner contours and
 * translated rear outer contour, in the original 48-point output order.
 */
export function originalWheelContours(points:readonly (readonly number[])[],innerScale:number){
 if(points.length!==4)throw Error('Original wheel contours require four projected points');
 const inner=[points[0].map(i16),...points.slice(1,3).map(p=>p.map((n,a)=>i16(points[0][a]+mul(i16(n-points[0][a]),innerScale))))];
 const outer=originalEllipseContour(points),shift=points[3].map((n,a)=>i16(n-points[0][a]));
 return [...outer,...originalEllipseContour(inner),...outer.map(p=>p.map((n,a)=>i16(n+shift[a])))];
}
