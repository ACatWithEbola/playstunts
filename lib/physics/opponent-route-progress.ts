/** Original 0x7236..0x725d after gettlistpoint; point was already incremented by caller. */
export function opponentRouteProgress(routeIndex:number,point:number,completed:number,last:number,nextRouteEntry:number){
 if(last&255){routeIndex=(routeIndex+1)&65535;if((nextRouteEntry&65535)===0){completed=(completed+1)&255;routeIndex=0;}point=0;}
 return {routeIndex,point,completed};
}
