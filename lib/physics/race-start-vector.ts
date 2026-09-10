import {i16,intSin,intCos} from './math.ts';
/** Original shared starting vector 0x9208..0x92bc, in world units. */
export function raceStartVector(column:number,row:number,angle:number,hill:0|1){
 const offset=(trig:(angle:number)=>number)=>((trig(angle+768)*512+8192)>>14)+((trig(angle+512)*4096+8192)>>14);
 return [i16(column*1024+offset(intSin)),(hill?450:0)+960,i16((29-row)*1024+offset(intCos))];
}
