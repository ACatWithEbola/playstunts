import {i16,type Vector} from '../physics/math.ts';
/** Supplied 2420F..242DF: perspective projection with the original overflow
 * guard, signed center addition and +/-32000 saturation sentinels.
 */
export function projectOriginalVector(vector:Vector,center:readonly number[],scale:readonly number[]):[number,number]{
 const z=i16(vector[2]);if(z<=0)return [-32768,-32768];
 const axis=(coordinate:number,origin:number,factor:number,reverse:boolean)=>{
  const value=i16(coordinate),negative=(value<0)!==reverse,product=Math.abs(value)*(factor&65535);
  const limit=i16((product>>>16)*2+((product&32768)?1:0));
  if(z<=limit)return negative?-32000:32000;
  const quotient=Math.floor(product/z);
  if(quotient>65535)throw Error('Original perspective division overflow');
  const sum=i16(negative?-quotient:quotient)+i16(origin);
  return sum>32767?32000:sum<-32768?-32000:sum;
 };
 return [axis(vector[0],center[0],scale[0],false),axis(vector[1],center[1],scale[1],true)];
}
