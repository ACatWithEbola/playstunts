import {i16} from '../physics/math.ts';
/** Supplied D179..D1B1 after a deferred overlay is queued. Player and
 * opponent bias updates are deliberately different in this executable.
 */
export function originalRoadCarDepthState(deferredOverlay:boolean,playerBias:number,opponentBias:number,tile:readonly number[],referenceTile:readonly number[]){
 let player=i16(playerBias),opponent=i16(opponentBias);
 if(deferredOverlay){if(player!==0)player=-1024;if(opponent!==0)opponent=i16(opponent-1024);}
 return {playerBias:player,opponentBias:opponent,tileMask:(tile[0]&255)===(referenceTile[0]&255)&&(tile[1]&255)===(referenceTile[1]&255)?0:-1};
}
