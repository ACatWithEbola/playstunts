import {i16} from './math.ts';
/** Supplied 0xa42d..0xa46a; applies after the ordinary mass/force conversion. */
export function opponentEngineForce(force:number,speedTableFirstByte:number){
 force=i16(force);
 const factor=(((200-(speedTableFirstByte&255))&65535)>>>1)&255;
 return factor?i16(force-Math.trunc(factor*force/200)):force;
}
