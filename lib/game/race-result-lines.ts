import {originalGameTime} from './game-time-format.ts';
import {originalRaceResultOutcome} from './race-result-outcome.ts';
export interface OriginalRaceResultTimes {playerTime:number;opponentTime:number;penaltyTime:number;opponentSelected:number;flags:number}
/** Original59b3..5c37 elapsed/penalty/opponent text, before statistics. */
export function originalRaceResultLines(state:OriginalRaceResultTimes,resources:Record<string,ReadonlyArray<number>>){
 const text=(key:string)=>{const bytes=resources[key];if(!bytes)throw Error('Missing original result text '+key);const end=bytes.indexOf(0);return String.fromCharCode(...(end<0?bytes:bytes.slice(0,end)));};
 const player=state.playerTime&65535,opponent=state.opponentTime&65535,penalty=state.penaltyTime&65535,lines:string[]=[];
 lines.push(text('eelt')+(player?originalGameTime(player-penalty)+((state.flags&2)?text('econ'):''):text('ednf')));
 if(player&&penalty)lines.push(text('eppt')+originalGameTime(penalty));
 if(state.opponentSelected&255){const win=opponent&&(!player||opponent<player);lines.push(text(win?'eowt':'eolt')+(opponent?originalGameTime(opponent):text('ednf')));}
 return {outcome:originalRaceResultOutcome(player,opponent,state.opponentSelected),lines:lines.map((text,index)=>({text,y:107+index*10}))};
}
