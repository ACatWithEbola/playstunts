import {intHypot,i16,type Vector} from '../physics/math.ts';
/** Original 0x19558. Vectors are the two listener-relative positions supplied
 * by the caller; the caller's sampling interval is passed unchanged.
 */
export function updateCarAudioTarget(before:Uint8Array,rpm:number,previous:Vector,current:Vector,interval:number,divisor:number,base:number){
 if(before.length!==76)throw Error('Invalid original car audio record');
 const record=before.slice(),v=new DataView(record.buffer);
 const distance=(p:Vector)=>intHypot(intHypot(p[0],p[2]),p[1]);
 const currentDistance=distance(current);
 if(currentDistance>6000){record[10]=0;return record;}
 const divide=(numerator:number,denominator:number)=>{
  if(!denominator)throw Error('Original audio divide fault');
  const quotient=Math.floor(numerator/denominator);
  if(quotient>65535)throw Error('Original audio divide overflow');
  return quotient;
 };
 const movement=i16(divide(100,interval&65535)*i16(distance(previous)-currentDistance));
 let volume=(127-divide(127*(currentDistance&65535),6000))&65535;
 if(movement>0)volume=(volume-(volume>>>4))&65535;
 const pitch=(divide(rpm&65535,divisor&255)+((base&255)<<4))&65535;
 const denominator=(6000-movement)&65535;
 if(denominator)v.setUint16(12,divide(6000*pitch,denominator),true);
 record[10]=volume;
 return record;
}
