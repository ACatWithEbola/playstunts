import {i16,intSin,intCos} from './math.ts';
/** Original opponent initializer arguments 0x9448..0x9523. */
export function opponentStartPosition(column:number,row:number,angle:number,hill:0|1){
 const offset=(trig:(angle:number)=>number)=>((trig(angle+512)*210+8192)>>14)+((trig(angle+768)*36+8192)>>14);
 return {position:[i16(column*1024+512+offset(intSin))*64,(hill?450:0)*64,i16((29-row)*1024+512+offset(intCos))*64],heading:i16(-angle)};
}
