import {opponentAdvanceGate} from './opponent-advance-gate.ts';
import {opponentRouteProgress} from './opponent-route-progress.ts';
import {opponentRouteDistance} from './opponent-route-distance.ts';
import type {Vector} from './math.ts';
export interface OpponentRouteState {routeIndex:number;point:number;completed:number}
/** Original gate and caller order: use old point, increment byte, then apply result. */
export function stepOpponentRoute<T extends {last:number}>(state:OpponentRouteState,angle:number,sliding:number,path:ArrayLike<number>,lookup:(routeEntry:number,point:number)=>T){
 if(!opponentAdvanceGate(angle,sliding))return {state:{...state},lookup:null};
 return advanceOpponentRoute(state,path,lookup);
}
/** Earlier 0x6f18..0x6fbf proximity gate is independent of sliding. */
export function stepOpponentRouteNear<T extends {last:number}>(state:OpponentRouteState,midpoint:Vector,position:Vector,path:ArrayLike<number>,lookup:(routeEntry:number,point:number)=>T){
 if(!opponentRouteDistance(midpoint,position).advance)return {state:{...state},lookup:null};
 return advanceOpponentRoute(state,path,lookup);
}
function advanceOpponentRoute<T extends {last:number}>(state:OpponentRouteState,path:ArrayLike<number>,lookup:(routeEntry:number,point:number)=>T){
 const result=lookup(path[state.routeIndex],state.point&255);
 const point=(state.point+1)&255;
 const next=result.last&255?path[(state.routeIndex+1)&65535]:0;
 return {state:opponentRouteProgress(state.routeIndex,point,state.completed,result.last,next),lookup:result};
}
