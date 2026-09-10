import {Euler,Vector3} from 'three';
import {originalExternalCameraClearance} from './external-camera-clearance.ts';
import type {Vector} from '../physics/math.ts';
import type {RenderPose} from './render-pose.ts';
import type {TrackObject} from '../physics/track.ts';
import type {CollisionPlane} from '../physics/plane.ts';

/** Fractional display evaluation of the original orbit construction and +50
 * look-at height. Keep the original terrain-clearance decision, but don't
 * re-quantize a high-resolution interpolated pose through 16-bit angle tables.
 * The executable-compatible camera remains separate for reference rendering.
 */
export function continuousExternalCamera(pose:RenderPose,raw:number[],objects:TrackObject[],planes:CollisionPlane[],distance:number,azimuth:number,elevation:number,mode=0){
 const unit=Math.PI/512,car=pose.position.map(n=>n/64) as Vector;
 const forward=new Vector3(0,0,1).applyEuler(new Euler(-pose.rotation[1]*unit,-pose.rotation[0]*unit,-pose.rotation[2]*unit,'YXZ'));
 const angle=Math.atan2(forward.x,forward.z)-azimuth*unit,e=elevation*unit;
 const position:Vector=[car[0]+distance*Math.sin(angle)*Math.cos(e),car[1]+distance*Math.sin(e),car[2]+distance*Math.cos(angle)*Math.cos(e)];
 const rounded=position.map(Math.round) as Vector,cleared=originalExternalCameraClearance(rounded,raw,objects,planes,mode);
 const corrected=position.map((n,i)=>n+cleared[i]-rounded[i]) as Vector;
 return {position:[corrected[0],corrected[1],-corrected[2]] as Vector,target:[car[0],car[1]+50,-car[2]] as Vector,up:[0,1,0] as Vector};
}
