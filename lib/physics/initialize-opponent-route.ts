import type {OpponentRouteTarget} from './opponent-decision.ts';
/** Supplied 0x9536..0x956a: the first lookup consumes a point, without processing its last flag. */
export function initializeOpponentRoute(selected:number,initializationMode:number,route:{routeIndex:number;point:number;completed:number},target:OpponentRouteTarget,path:number[],lookup:(entry:number,point:number)=>OpponentRouteTarget&{last:number}){
 if(!(selected&255)||(initializationMode&65535)===65534)return {route:{...route},routeTarget:target};
 const point=route.point&255;
 const result=lookup(path[route.routeIndex&65535],point);
 return {route:{...route,point:(point+1)&255},routeTarget:{midpoint:result.midpoint,first:result.first,second:result.second,side:result.side}};
}
