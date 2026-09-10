import {i16} from './math.ts';
/** Original 0x7031..0x7044 and 0x7208..0x7210; lookup executes after this gate. */
export function opponentAdvanceGate(angle:number,sliding:number){
 const signed=i16(angle);
 return !(sliding&255)&&i16(signed<0?-signed:signed)>256;
}
