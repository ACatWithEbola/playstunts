import {advancePlayerNavigation} from '../physics/player-navigation.ts';
import {updateCrashState,type CrashRaceState} from './crash-state.ts';
/** Original post-movement navigation and player finish dispatch, through 9e3c. */
export function playerRaceNavigation(race:CrashRaceState,...args:Parameters<typeof advancePlayerNavigation>){
 const navigation=advancePlayerNavigation(...args);
 let next={...race,stats:[...race.stats]};
 next.stats[7]=navigation.state.progress.totalPenalty;
 if(navigation.finish)next=updateCrashState(next,3,0).state;
 return {race:next,navigation:{...navigation.state,guidance:{...navigation.state.guidance,crash:next.crash}},finish:navigation.finish};
}
