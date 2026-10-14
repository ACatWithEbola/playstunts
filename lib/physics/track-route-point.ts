import {lookupRoutePoint,lookupRoutePointWithSide} from './lookup-route-point.ts';
import type {PhysicsEngineVersion} from './engine-version.ts';
export interface TrackRoute {tiles:number[];directions:number[];columns:number[];routeRows:number[]}
export function trackRoutePoint(raw:number[],route:TrackRoute,entry:number,point:number,records:Parameters<typeof lookupRoutePoint>[6],vectors:Parameters<typeof lookupRoutePoint>[7],objects:Parameters<typeof lookupRoutePoint>[8],physicsEngine?:PhysicsEngineVersion){
 const column=route.columns[entry],row=route.routeRows[entry];
 return lookupRoutePoint(route.tiles[entry],route.directions[entry],point,column,row,raw[901+row*30+column],records,vectors,objects,physicsEngine);
}
/** Opponent lookup: caller supplies the current DOS table and adjacent bytes. */
export function trackOpponentRoutePoint(raw:number[],route:TrackRoute,entry:number,point:number,records:Parameters<typeof lookupRoutePoint>[6],vectors:Parameters<typeof lookupRoutePoint>[7],objects:Parameters<typeof lookupRoutePoint>[8],descriptorSpeedBytes:ArrayLike<number>,speedContext:ArrayLike<number>,physicsEngine?:PhysicsEngineVersion){
 const column=route.columns[entry],row=route.routeRows[entry],tile=route.tiles[entry];
 return lookupRoutePointWithSide(tile,route.directions[entry],point,column,row,raw[901+row*30+column],records,vectors,objects,descriptorSpeedBytes[tile],speedContext,physicsEngine);
}
