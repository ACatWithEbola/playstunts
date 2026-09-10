import {i16,intHypot,intHypot3d,type Vector} from './math.ts';
/** Original 0x6f18..0x6f72: signed distance and near-point branch. */
export function opponentRouteDistance(midpoint:Vector,position:Vector){
 const relative=midpoint.map((v,i)=>i16(v-position[i])) as Vector;
 const distance=midpoint[1]===-1?intHypot(relative[0],relative[2]):intHypot3d(relative);
 return {distance,advance:distance<200};
}
