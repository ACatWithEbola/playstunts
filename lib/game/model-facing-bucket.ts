import {i16,intAtan2,intHypot,type Vector} from '../physics/math.ts';
/** Supplied 17FC6..180FF: thirty azimuth/elevation bands and two poles. */
export function originalModelFacingBucket(vector:Vector,ratios:readonly number[]){
 const [x,y,z]=vector.map(i16),vertical=i16(Math.abs(y));
 const horizontal=intHypot(i16(Math.abs(x)),i16(Math.abs(z)))&65535;
 const pole=ratios[0]===ratios[1]?vertical>horizontal:Math.imul(vertical,ratios[1])>Math.imul(horizontal,ratios[0]);
 if(pole&&y<0)return 30;if(pole&&y>0)return 31;
 let angle=i16(-intAtan2(z,i16(-x)));if(angle<0)angle=i16(angle+1024);
 return ((y>0?15:0)+((angle*15)>>10))&255;
}
