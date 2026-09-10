import {i16} from '../physics/math.ts';
const mul=(n:number,k:number)=>i16((Math.imul(i16(n),k)+8192)>>14);
/** Original 28246..285E4: 32-point large ellipse, distinct from 16-point wheels. */
export function originalLargeEllipseContour(points:readonly (readonly number[])[]){
 if(points.length<3)throw Error('Original ellipse requires center and two axis points');
 const offsets=Array.from({length:16},()=>[0,0]);
 for(let axis=0;axis<2;axis++){
  const a=i16(points[1][axis]-points[0][axis]),b=i16(points[2][axis]-points[0][axis]),ah=a>>1,aq=ah>>1,at=i16(ah+aq),bh=b>>1,bq=bh>>1,bt=i16(bh+bq);
  const values=[a,mul(a+bq,0x3e17),mul(a+bh,0x393e),mul(a+bt,0x3333),mul(a+b,0x2d41),mul(b+at,0x3333),mul(b+ah,0x393e),mul(b+aq,0x3e17),b,mul(b-aq,0x3e17),mul(b-ah,0x393e),mul(b-at,0x3333),mul(b-a,0x2d41),mul(-a+bt,0x3333),mul(-a+bh,0x393e),mul(-a+bq,0x3e17)];
  values.forEach((value,i)=>offsets[i][axis]=value);
 }
 return [...offsets.map(p=>p.map((n,a)=>i16(points[0][a]+n))),...offsets.map(p=>p.map((n,a)=>i16(points[0][a]-n)))];
}
