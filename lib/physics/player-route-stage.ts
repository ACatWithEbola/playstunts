import {lookupPlayerRoute,type PlayerRouteGraph} from './player-route-lookup.ts';
import {playerRouteProgress,type PlayerRouteProgress} from './player-route-progress.ts';
import type {Vector} from './math.ts';
/** Original 98df..99de: locate the track section, then update route/penalty state. */
export function stepPlayerRoute(before:PlayerRouteProgress,cache:readonly number[],position:Vector,graph:PlayerRouteGraph,framesPerSecond:10|20=20){
 const lookup=lookupPlayerRoute(before.route,cache,position,graph);
 return {progress:playerRouteProgress(before,lookup.changed,lookup.route,lookup.delta,graph.primary,graph.alternate,framesPerSecond),cache:lookup.cache};
}
