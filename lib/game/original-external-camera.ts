import {originalOrbitCameraPlacement} from './orbit-camera-placement.ts';
import {originalExternalCameraClearance} from './external-camera-clearance.ts';
import {originalExternalCameraAngles} from './external-camera-angles.ts';
import {rotateZXY} from '../physics/rotation.ts';
import {i16,vecTransform,type Vector} from '../physics/math.ts';
import type {TrackObject} from '../physics/track.ts';
import type {CollisionPlane} from '../physics/plane.ts';

/** One camera authority for native replay rendering and modern presentation.
 * Position, terrain correction and view angles follow BFC4..C16E. The display
 * frame only reflects world Z for the browser's coordinate convention.
 */
export function originalExternalCamera(car:Vector,rotation:Vector,raw:number[],objects:TrackObject[],planes:CollisionPlane[],distance:number,azimuth:number,elevation:number,mode=0){
 const position=originalExternalCameraClearance(originalOrbitCameraPlacement(car,rotation,distance,azimuth,elevation),raw,objects,planes,mode);
 const view=originalExternalCameraAngles(car,position),angles=[0,view.pitch,view.heading] as Vector;
 const inverse=rotateZXY(0,i16(-view.pitch),i16(-view.heading));
 const forward=vecTransform([0,0,16384],inverse),up=vecTransform([0,16384,0],inverse);
 const reflect=(p:Vector):Vector=>[p[0],p[1],-p[2]];
 return {position,angles,display:{position:reflect(position),target:reflect(position.map((n,i)=>n+forward[i]/16384) as Vector),up:reflect(up.map(n=>n/16384) as Vector)}};
}
