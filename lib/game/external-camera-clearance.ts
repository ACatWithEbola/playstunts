import {trackPlaneContact,type TrackObject} from '../physics/track.ts';
import {planeDistance,type CollisionPlane} from '../physics/plane.ts';
import {i16,vecTransform,type Vector} from '../physics/math.ts';
/** Original C092..C118. Uses the same original collision selection as driving. */
export function originalExternalCameraClearance(camera:Vector,raw:number[],objects:TrackObject[],planes:CollisionPlane[],mode=0):Vector{
 const x=i16(camera[0]),z=i16(camera[2]);
 if(x<0||x>=30720||z<0||z>=30720){
  const ground=((x^z)>>8)&1;
  return [x,Math.max(i16(camera[1]),ground+12),z];
 }
 const point=camera.map(n=>i16(n)*64) as Vector;
 const contact=trackPlaneContact(raw,objects,point,point,mode);
 const result=[i16(camera[0]),Math.max(i16(camera[1]),contact.tileOrigin[1]),i16(camera[2])] as Vector;
 if(contact.underside){
  const plane=planes[contact.planeId];
  const distance=planeDistance(result,plane,contact.tileOrigin);
  if(distance<12){const correction=vecTransform([0,i16(12-distance),0],plane.rotation);return result.map((n,i)=>i16(n+correction[i])) as Vector;}
 }
 return result;
}
