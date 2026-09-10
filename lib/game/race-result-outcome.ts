/** Supplied5b03..5c37. Zero means unfinished, comparisons are unsigned,
 * and an exact tie goes to the player. Solo driving retains outcome2. */
export function originalRaceResultOutcome(playerTime:number,opponentTime:number,opponentSelected:number){
 playerTime&=65535;opponentTime&=65535;
 if(!(opponentSelected&255))return 2;
 if(opponentTime&&(!playerTime||opponentTime<playerTime))return 1;
 return playerTime?0:2;
}
