import {routePointIndex} from './route-point-index.ts';
import {routePointPair} from './route-point-pair.ts';
import {rotateRoutePointPair} from './route-point-rotation.ts';
import {routePointHeight} from './route-point-height.ts';
import {routePointWorld} from './route-point-world.ts';
import {routePointResult} from './route-point-result.ts';
export interface RoutePointInput {primary:number[][];alternate:number[][]|null;point:number;count:number;reverse:number;rotation:number;terrain:number;column:number;row:number;multiTile:number}
/** gettlistpoint coordinate pipeline; route-record lookup and optional side output are external. */
export function calculateRoutePoint(input:RoutePointInput){
 const {primary,alternate,point,count,reverse,rotation,terrain,column,row,multiTile}=input;
 const pair=routePointPair(primary,alternate,routePointIndex(point,count,reverse),reverse);
 const rotated=rotateRoutePointPair(pair.first,pair.second,rotation);
 const raised=routePointHeight(rotated.first,rotated.second,terrain);
 const world=routePointWorld(raised.first,raised.second,column,row,multiTile);
 return routePointResult(world.first,world.second,pair.alternate,point,count);
}
