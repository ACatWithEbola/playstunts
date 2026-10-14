import {i16} from './math.ts';
/** Original 0x7269..0x72b8: clamp target, then move steering by at most eight. */
export function opponentSteeringStep(current:number,requested:number,step:8|16=8){
 current=i16(current);const target=Math.max(-65,Math.min(65,i16(requested)));
 const difference=i16(target<current?current-target:target-current);
 return difference>step?i16(current+(target<current?-step:step)):target;
}
