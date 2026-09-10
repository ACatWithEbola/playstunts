import {i16,type Vector} from '../physics/math.ts';
/** Supplied 24E4A..24E9E: word deltas and logical halving before signed division. */
export function originalNearPlaneIntersection(front:Vector,back:Vector,plane=12):Vector{
 let numerator=i16(plane-back[2]),denominator=i16(front[2]-back[2]);
 if(denominator<0){numerator=(numerator&65535)>>>1;denominator=(denominator&65535)>>>1;}
 if(!denominator)throw Error('Original near-plane intersection divides by zero');
 const coordinate=(axis:number)=>{
  const quotient=Math.trunc(i16(front[axis]-back[axis])*numerator/denominator);
  if(quotient< -32768||quotient>32767)throw Error('Original near-plane intersection overflows signed division');
  return i16(quotient+back[axis]);
 };
 return [coordinate(0),coordinate(1),i16(plane)];
}
