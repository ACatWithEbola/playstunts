/** Keyboard steering reconstructed from upd_statef20_from_steer_input.
 * The 20 Hz response table is byte-identical in the supplied executable at
 * file offset 186210. This is steering input, not tyre/yaw integration.
 */
import { i16, u16 } from './math.ts';
const response20 = [8,7,6,5,4,4,3,3,2,2,2,1,1,1,1,1];
const response10 = [16,14,12,10,8,8,6,6,4,4,4,2,2,1,1,1];
export function stepSteering(angle:number,roadSpeed:number,input:0|1|2|3,fps:10|20=20):number {
  angle=i16(angle);
  roadSpeed=u16(roadSpeed);
  const rate=(fps===20?response20:response10)[roadSpeed>>>12];
  const requested=input===1?rate:input===2?-rate:0;
  let delta=requested;
  if ((delta>0 && angle < -1) || (delta<0 && angle>1)) delta*=4;
  if (!delta && roadSpeed && angle) {
    delta=Math.min(Math.abs(angle),rate*2)*(angle>0?-1:1);
  }
  const limit=fps===10?160:80;
  delta=Math.max(-limit,Math.min(limit,delta));
  angle=Math.max(-240,Math.min(240,i16(angle+delta)));
  if (!requested && Math.abs(angle)<8) angle=0;
  return angle;
}
