import {upgradedCameraBasis} from './upgraded-camera-basis.ts';
import type {RenderPose} from './render-pose.ts';
import type {Vector} from '../physics/math.ts';

/** Project the captured native camera without retargeting or rebuilding its
 * orbit. Fractional angles are allowed only between native source endpoints. */
export function upgradedSourceCamera(camera:RenderPose){
 const basis=upgradedCameraBasis(camera.rotation);
 const position:Vector=[camera.position[0],camera.position[1],-camera.position[2]];
 return {position,target:[position[0]+basis.forward[0],position[1]+basis.forward[1],position[2]-basis.forward[2]] as Vector,up:[basis.up[0],basis.up[1],-basis.up[2]] as Vector};
}

/** Native car submissions shift the fixed-point origin by six bits. Preserve
 * those same endpoints before interpolating; mixing a fractional car with a
 * rounded native camera made low-speed relative placement drift cyclically. */
export function readUpgradedCarPose(view:DataView,address:number):RenderPose{
 return {position:[0,1,2].map(axis=>view.getInt32(address+axis*4,true)>>6) as Vector,rotation:[0,1,2].map(axis=>view.getInt16(address+24+axis*2,true)) as Vector};
}
