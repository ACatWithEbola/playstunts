import {i16,type Vector} from './math.ts';
import {trackPlaneContact} from './track.ts';
import {planeDistance,type CollisionPlane} from './plane.ts';
/** MS91 body-height guard with explicitly retained race state.
 * Separate runtimeMode from track selection mode: only the former suppresses
 * the same-plane sign-crossing request during introduction.
 */
export function bodyPlaneCrosses(oldDistance:number,newDistance:number,runtimeMode:number){
 const old=i16(oldDistance),next=i16(newDistance);
 return runtimeMode!==1&&((old<0&&next>0)||(old>0&&next<0));
}
export function bodyPlaneContact(points:readonly Vector[],previous:readonly Vector[],track:{raw:number[];objects:Parameters<typeof trackPlaneContact>[1];planes:CollisionPlane[];mode?:number},runtimeMode:number){
 if(points.length!==4||previous.length!==4)throw Error('Body-plane cache requires four current and retained points');
 const cache=previous.map(p=>[...p] as Vector),decisions=[];
 const select=(point:Vector,old:Vector)=>trackPlaneContact(track.raw,track.objects,point.map(v=>v*64) as Vector,old.map(v=>v*64) as Vector,track.mode??0,undefined,'ms-1991');
 for(let wheel=0;wheel<4;wheel++){
  const point=points[wheel],selected=select(point,cache[wheel]),plane=track.planes[selected.planeId];
  if(!plane)throw Error('Missing original body collision plane');
  const distance=planeDistance(point,plane,selected.tileOrigin);
  let crash=selected.planeId<4&&distance<=0,oldPlane:number|undefined,oldDistance:number|undefined;
  if(selected.planeId>=4){
   const prior=select(cache[wheel],point);oldPlane=prior.planeId;
   if(prior.planeId===selected.planeId){
    oldDistance=planeDistance(cache[wheel],track.planes[prior.planeId],prior.tileOrigin);
    crash=bodyPlaneCrosses(oldDistance,distance,runtimeMode);
   }
  }
  decisions.push({wheel,plane:selected.planeId,distance,oldPlane,oldDistance,crash});
  // Event5 does not exit the original four-point loop: later points and the
  // current cache still update even after the crash request has been made.
  cache[wheel]=[...point];
 }
 return {cache,decisions,crash:decisions.some(d=>d.crash)};
}
