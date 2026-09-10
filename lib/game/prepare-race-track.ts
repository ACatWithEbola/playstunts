import {analyzeRoute} from '../physics/route-analysis.ts';
import {scanStart} from '../physics/start-scan.ts';
import type {PlayerRouteGraph} from '../physics/player-route-lookup.ts';
import type {Vector} from '../physics/math.ts';
/** Prepare race traversal, start position and trackside cameras from original track resources. */
export function prepareRaceTrack(...args:Parameters<typeof analyzeRoute>){
 const result=analyzeRoute(...args);
 if(result.terrainError?.error)throw Error(`Original terrain error ${result.terrainError.error}`);
 if(!result.route||result.route.error||!result.samples)throw Error(`Original track route error ${result.route?.error??'unavailable'}`);
 const [raw,,,,objects]=args,route=result.route,start=scanStart(raw);
 const graph:PlayerRouteGraph={primary:route.primary.map(n=>n&65535),alternate:route.secondary.map(n=>n&65535),columns:route.columns,rows:route.routeRows,footprints:route.tiles.map(tile=>objects[tile].multiTile)};
 return {raw,route,graph,metadata:result.metadata,trackside:result.samples.positions as Vector[],start:{column:start.start[0],hill:start.start[1] as 0|1,row:start.start[2],angle:start.heading}};
}
