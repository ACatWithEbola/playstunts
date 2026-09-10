import {continuousExternalCamera} from './continuous-external-camera.ts';
import {drivingCamera,type DrivingView} from './driving-camera.ts';
import {originalExternalCamera} from './original-external-camera.ts';
import type {RenderPose} from './render-pose.ts';
import type {Vector} from '../physics/math.ts';
import type {TrackObject} from '../physics/track.ts';
import type {CollisionPlane} from '../physics/plane.ts';

/** The chase follows through the original external-camera mechanism. Only the
 * requested transporter presentation blends into it after the rollout ends.
 */
export function nativeDrivingCamera(pose:RenderPose,view:DrivingView,carHeight:number,track:{raw:number[];objects:TrackObject[];planes:CollisionPlane[];mode:number},rolloutProgress?:number,fullSizeCar=false,continuous=false){
 const transition=drivingCamera(pose,view,carHeight,rolloutProgress,fullSizeCar);
 if(view==='cockpit')return transition;
 const car=pose.position.map(n=>Math.floor(n/64)) as Vector;
 // Elevation 48 keeps the optional following eye below the original
 // finish gantry crossbar (86..121 world units); geometry stays untouched.
 const source=continuous?continuousExternalCamera(pose,track.raw,track.objects,track.planes,210,512,48,track.mode):originalExternalCamera(car,pose.rotation.map(Math.round) as Vector,track.raw,track.objects,track.planes,210,512,48,track.mode).display;
 // Equal target distances keep the blend focused rather than collapsing its
 // direction vector as it approaches the original unit-length display target.
 const target=continuous?source.target:source.target.map((n,i)=>source.position[i]+300*(n-source.position[i])) as Vector;
 if(rolloutProgress===undefined)return {...source,target};
 const t=Math.max(0,Math.min(1,(rolloutProgress-1)*1.5));
 const weight=t*t*t*(t*(t*6-15)+10);
 const blend=(a:Vector,b:Vector)=>a.map((n,i)=>n+(b[i]-n)*weight) as Vector;
 return {position:blend(transition.position,source.position),target:blend(transition.target,target),up:blend(transition.up,source.up)};
}

/** Interpolate camera results between original ticks, rather than rounding an
 * already interpolated pose back to DOS camera units on every display frame.
 * No extra lag or spring is introduced; source tick endpoints stay exact.
 */
export function interpolateNativeCamera(before:ReturnType<typeof nativeDrivingCamera>,after:ReturnType<typeof nativeDrivingCamera>,fraction:number){
 const t=Math.max(0,Math.min(1,fraction));
 const blend=(a:Vector,b:Vector)=>a.map((n,i)=>n+(b[i]-n)*t) as Vector;
 return {position:blend(before.position,after.position),target:blend(before.target,after.target),up:blend(before.up,after.up)};
}
