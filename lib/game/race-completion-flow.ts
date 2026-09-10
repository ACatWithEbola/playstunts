/** Original13f52..13fb0, with demo flag clear. Finishing manual replay
 * returns to replay controls; finishing normal driving leaves the race. */
export function originalRaceCompletion(done:number,mode:number,evaluationCause:number){
 done&=255;mode&=255;evaluationCause&=255;
 if(done){
  if((mode===0&&evaluationCause!==4)||done===2)return {done,mode,action:'exit' as const};
  return {done:0,mode:2,action:'initialize-replay-controls' as const};
 }
 return {done,mode,action:mode===2?'replay-controls' as const:'input' as const};
}
/** Original14083..140a1: normal racing waits for an unfinished opponent. */
export function originalRaceNeedsOpponentWait(mode:number,opponentSelected:number,opponentStatus:number){return (mode&255)===0&&(opponentSelected&255)!==0&&(opponentStatus&255)===0;}
/** Original14143..1415b. The time comparison is equality, not a bound. */
export function originalOpponentWaitContinues(key:number,opponentStatus:number,frame:number,timeAdjustment:number){return (key&65535)!==27&&(opponentStatus&255)===0&&((frame+timeAdjustment)&65535)!==30000;}
