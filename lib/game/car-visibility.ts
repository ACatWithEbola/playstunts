/** Original player/opponent draw gates at c74d..c768 and c8eb..c910.
 * Crash 1 remains drawable; crash 2 (water) is omitted from the world scene.
 */
export function originalCarVisible(viewMode:number,focusOpponent:boolean,crash:number,opponent=false,opponentSelected=true){
 if(opponent&&!opponentSelected)return false;
 if(viewMode===0&&focusOpponent===opponent)return false;
 return crash!==2;
}
