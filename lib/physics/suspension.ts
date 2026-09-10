/** carState_rc_op, verified against the supplied executable at 0x18e22.
 * State names retain the recovered structure where physical meaning is not
 * fully established. Returns the height correction used to rebuild chassis.
 */
import { i16 } from './math.ts';
export interface SuspensionState {rc2:number;rc4:number;rc5:number}
export function stepSuspension(before:SuspensionState,distance:number):SuspensionState&{height:number} {
 const s={...before};const original=i16(s.rc2);let correction=0;
 distance=i16(distance);
 if(s.rc5<0)s.rc5=Math.min(0,i16(s.rc5+4));else if(s.rc5>0)s.rc5=Math.max(0,i16(s.rc5-4));
 if(distance<0 && s.rc2>i16(-distance))distance=0;
 if(!distance){
  if(s.rc2>s.rc5){s.rc2=Math.max(s.rc5,i16(s.rc2-128));correction=i16(original-s.rc2)}
  else if(s.rc2<s.rc5)s.rc2=Math.min(s.rc5,i16(s.rc2+128));
 }else if(distance>0){s.rc2=Math.min(384,i16(s.rc2+Math.min(distance,192)));s.rc4=0}
 else{
  if(i16(distance+s.rc2)>-288)s.rc2=i16(s.rc2+distance);
  else s.rc2=Math.max(-384,i16(s.rc2+Math.trunc(i16(distance*3)/4)));
  correction=i16(original-s.rc2+distance);
 }
 return {...s,height:i16(original+correction)};
}
