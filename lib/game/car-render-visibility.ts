/** Supplied player C74D..C767 and opponent C8EB..C90F gates.
 * Keep the two camera bytes separate: the original uses opposite polarity
 * for the second byte when the first is zero.
 */
export function originalCarRenderVisibility(cameraMode:number,cameraTarget:number,playerStatus:number,opponentStatus:number,opponentPresent:number){
 const mode=cameraMode&255,target=cameraTarget&255;
 return {player:(mode!==0||target!==0)&&(playerStatus&255)!==2,
 opponent:(opponentPresent&255)!==0&&(mode!==0||target===0)&&(opponentStatus&255)!==2};
}
