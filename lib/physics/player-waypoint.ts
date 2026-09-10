import {i16,intAtan2,vecTransform,type Vector} from './math.ts';
import {opponentPose} from './opponent-pose.ts';
export interface PlayerWaypointState {position:Vector;rotation:Vector;target:Vector;routeIndex:number;point:number;status:number;previousStatus:number;crash:number;warning:number;confirmations:number;route:number;lastRoute:number}
export interface PlayerWaypointPoint {position:Vector;end:number|boolean}
/** Original player_op 99de..9cc5. The caller supplies original gettlistpoint results. */
export function playerWaypoint(before:PlayerWaypointState,primary:number[],alternate:number[],lookup:(route:number,point:number)=>PlayerWaypointPoint){
 let {routeIndex,point,status,confirmations}=before,target=[...before.target] as Vector,warning=0;
 routeIndex&=65535;point&=255;status&=255;confirmations&=255;
 const result=(skipPostMove=false,skipDirection=false)=>({routeIndex,point,status,confirmations,target,warning,skipPostMove,skipDirection});
 if(status===1)return result(true);
 const pose=opponentPose(before.position,before.position,before.rotation);
 const depth=(v:Vector,scanning:boolean)=>vecTransform(v.map((n,i)=>i16(i===1&&n===-1?(scanning?-pose.position[i]:0):n-pose.position[i])) as Vector,pose.matrix)[2];
 let select=status===2;
 if(select){if(!(before.crash&255))warning=3;}
 else {
  if(routeIndex!==65535&&((before.previousStatus!==0&&status===0)||(routeIndex!==(before.route&65535)&&routeIndex!==(primary[before.route]&65535)&&routeIndex!==(alternate[before.route]&65535))))routeIndex=65535;
  if(routeIndex!==65535&&depth(target,false)>=200)return result();
  select=routeIndex===65535;
 }
 if(select){
  const route=(status===2?before.lastRoute:before.route)&65535;
  // At a fork the executable skips selection and goes straight to its finish check.
  if((alternate[route]&65535)!==65535)return result(false,true);
  let best=0,bestDepth=0,index=0;
  for(;;){
   const next=lookup(route,index);target=[...next.position];const z=depth(target,true);
   if(index===0||(z<bestDepth&&z>0)){best=index;bestDepth=z;}
   index=(index+1)&255;
   if(next.end)break;
   if(index===0)throw Error('Original waypoint scan wrapped without an end point');
  }
  let accept=status!==2;
  if(status===2){
   const a=lookup(route,best===0?0:best-1).position,b=lookup(route,best===0?1:best).position;
   const heading=intAtan2(i16(a[0]-b[0]),i16(b[2]-a[2]))&1023;
   const difference=(before.rotation[0]-heading)&1023;
   if(difference>896||difference<128){status=0;confirmations=1;accept=true;}
  }
  if(accept){routeIndex=status===0&&before.status===2?route:before.route&65535;point=best;}
 }
 const next=lookup(routeIndex,point);point=(point+1)&255;target=[...next.position];
 if(next.end){routeIndex=(alternate[before.route]&65535)!==65535?65535:primary[before.route]&65535;point=0;}
 return result();
}
