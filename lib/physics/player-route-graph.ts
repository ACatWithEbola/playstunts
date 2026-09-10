import {traverseRoute} from './route-traversal.ts';
import type {PlayerRouteGraph} from './player-route-lookup.ts';
/** Build player lookup tables from native track traversal and original footprint flags. */
export function buildPlayerRouteGraph(raw:number[],descriptors:Parameters<typeof traverseRoute>[1],objects:{multiTile:number}[]):PlayerRouteGraph{
 const route=traverseRoute(raw,descriptors);
 if(route.error)throw Error(`Original track route error ${route.error}`);
 return {primary:route.primary.map(n=>n&65535),alternate:route.secondary.map(n=>n&65535),columns:route.columns,rows:route.routeRows,footprints:route.tiles.map(tile=>{
  if(!objects[tile])throw Error('Missing original route footprint');return objects[tile].multiTile;
 })};
}
