import {stepPlayerRoute} from './player-route-stage.ts';
import {playerRouteGuidance,type PlayerGuidanceState} from './player-route-guidance.ts';
import type {PlayerRouteProgress} from './player-route-progress.ts';
import type {PlayerRouteGraph} from './player-route-lookup.ts';
export interface PlayerNavigationState {progress:PlayerRouteProgress;cache:readonly number[];guidance:PlayerGuidanceState}
/** Original 98df..9e3c after movement, before finish event dispatch. */
export function playerNavigation(before:PlayerNavigationState,graph:PlayerRouteGraph,...track:Parameters<typeof playerRouteGuidance> extends [unknown,...infer Rest]?Rest:never){
 const located=stepPlayerRoute(before.progress,before.cache,before.guidance.position,graph);
 const guidance=playerRouteGuidance({...before.guidance,status:located.progress.status,previousStatus:before.progress.status,confirmations:located.progress.confirmations,route:located.progress.route,lastRoute:located.progress.lastRoute,laps:located.progress.laps},...track);
 return {progress:{...located.progress,status:guidance.status,confirmations:guidance.confirmations},cache:located.cache,guidance};
}

/** Carry navigation state between physics frames without re-seeding route state. */
export function advancePlayerNavigation(...args:Parameters<typeof playerNavigation>){
 const result=playerNavigation(...args),before=args[0];
 const state:PlayerNavigationState={progress:result.progress,cache:result.cache,guidance:{...before.guidance,...result.guidance,route:result.progress.route,lastRoute:result.progress.lastRoute,laps:result.progress.laps,previousStatus:before.progress.status,wheelAngle:result.guidance.targetAlternate}};
 return {state,finish:result.guidance.finish};
}
