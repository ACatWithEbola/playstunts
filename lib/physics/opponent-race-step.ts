import {opponentPostMove} from './opponent-post-move.ts';
import {opponentFinish} from './opponent-finish.ts';
/** Supplied opponent tail after movement, including finish-event side effects. */
export function opponentRaceStep(args:Parameters<typeof opponentPostMove>,raceWords:number[],savedRaceWords:number[],timeAdjustment:number,flags:number){
 const post=opponentPostMove(...args);
 const race=post.finish?opponentFinish(args[3],raceWords,savedRaceWords,timeAdjustment,flags):{status:args[3]&255,raceWords:[...raceWords],savedRaceWords:[...savedRaceWords]};
 return {...post,...race};
}
