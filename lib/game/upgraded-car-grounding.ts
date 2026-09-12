import * as THREE from 'three';
import type {Shape} from './types.ts';
import type {Vector} from '../physics/math.ts';

/** Native flat-road contact: six units of chassis lift (384/64), plus two
 * collision-plane units above the drawn road. Source tire rims are not all
 * based at local Y=0, so derive the race-only visual correction per car.
 * Use the lowest racing rim to avoid sinking another axle into the road;
 * exclude fixed spare wheels and retain the same offset for every LOD. */
export function upgradedCarGroundingOffset(shape:Shape|undefined):number {
 if(!shape)return 0;
 const rims=shape.primitives.filter(p=>p.type===12&&p.indices.every(i=>i>=8&&i<32)).flatMap(p=>[0,3].map(end=>{
  const [center,a,b]=p.indices.slice(end,end+3).map(i=>shape.vertices[i]);
  return center[1]-Math.hypot(a[1]-center[1],b[1]-center[1]);
 }));
 return rims.length?Math.max(0,384/64+2+Math.min(...rims)):0;
}

/** Replace only the upgraded race model's presentation pose. The input
 * native pose is read-only. Lower along the car's rotated local up axis,
 * never global Y or camera space, and retain the constant offset in flight.
 * Wheels and the single shadow caster inherit this same group transform. */
export function setUpgradedCarPresentationPose(model:THREE.Group,position:Vector,rotation:Vector,lowering:number) {
 model.position.set(...position);
 model.rotation.set(-rotation[1]*Math.PI/512,-rotation[0]*Math.PI/512,-rotation[2]*Math.PI/512,'YXZ');
 model.position.add(new THREE.Vector3(0,-lowering,0).applyQuaternion(model.quaternion));
}
