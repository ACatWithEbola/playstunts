/** Recovered vector_op_unk: intersection with a constant-Z plane.
 * Callers order endpoints along Z. The logical shifts preserve unsigned
 * distances greater than 32767 before the original signed division.
 */
import { i16,u16,type Vector } from './math.ts';
export function intersectZ(first:Vector,second:Vector,z:number):Vector {
 let numerator=i16(z-second[2]),denominator=i16(first[2]-second[2]);
 if(denominator<0){numerator=u16(numerator)>>>1;denominator=u16(denominator)>>>1}
 if(!denominator)throw Error('Parallel segment has no unique intersection');
 const coordinate=(axis:number)=>{
  const quotient=Math.trunc(i16(first[axis]-second[axis])*numerator/denominator);
  if(quotient<-32768||quotient>32767)throw Error('Original intersection division overflows');
  return i16(quotient+second[axis]);
 };
 return [coordinate(0),coordinate(1),i16(z)];
}
