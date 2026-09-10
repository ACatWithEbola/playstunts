import {playerWaypoint,type PlayerWaypointState} from './player-waypoint.ts';
import {playerPostMove} from './player-post-move.ts';
import {trackRoutePoint,type TrackRoute} from './track-route-point.ts';
import type {Vector} from './math.ts';
// wheelAngle is the older helper name for DS:8cd6: the route-point alternate flag, not steering.
export interface PlayerGuidanceState extends PlayerWaypointState {angle:number;wheelAngle:number;laps:number;targetFirst?:Vector;targetSecond?:Vector}
/** Original player_op 99de..9e3c, including the fork's direct finish-check branch. */
export function playerRouteGuidance(before:PlayerGuidanceState,raw:number[],route:TrackRoute&{primary:number[];secondary:number[]},records:Parameters<typeof trackRoutePoint>[4],vectors:Parameters<typeof trackRoutePoint>[5],objects:Parameters<typeof trackRoutePoint>[6],start:{x:number;z:number;angle:number}){
 let targetAlternate=before.wheelAngle,targetFirst=before.targetFirst,targetSecond=before.targetSecond;
 const details=()=>before.targetFirst&&before.targetSecond?{targetFirst,targetSecond}:{};
 const waypoint=playerWaypoint(before,route.primary,route.secondary,(entry,point)=>{
  const result=trackRoutePoint(raw,route,entry,point,records,vectors,objects);
  targetAlternate=result.alternate;targetFirst=result.first as Vector;targetSecond=result.second as Vector;
  return {position:result.midpoint as Vector,end:result.last};
 });
 if(waypoint.skipPostMove)return {...waypoint,angle:before.angle&65535,finish:false,targetAlternate,...details()};
 const post=playerPostMove({position:before.position,rotation:before.rotation,target:waypoint.target,routeIndex:waypoint.skipDirection?65535:waypoint.routeIndex,routeStatus:waypoint.status,crash:before.crash,laps:before.laps,angle:before.angle,warning:waypoint.warning,wheelAngle:targetAlternate},start.x,start.z,start.angle);
 return {...waypoint,...post,targetAlternate,...details()};
}
