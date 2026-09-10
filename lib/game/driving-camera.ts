import {cockpitEyeOffset} from './cockpit-eye-offset.ts';
import { Euler, Vector3 } from 'three';
import type { RenderPose } from './render-pose.ts';
import type { Vector } from '../physics/math.ts';

export type DrivingView = 'cockpit' | 'chase';

/** Reflect Stunts world Z into Three's right-handed display world. */
export function displayPoint(point: readonly number[]): Vector {
  return [point[0], point[1], -point[2]];
}

export function drivingCamera(pose: RenderPose, view: DrivingView, carHeight:number, rolloutProgress?:number, fullSizeCar=false) {
  const rotation = new Euler(
    (-pose.rotation[1] * Math.PI) / 512,
    (-pose.rotation[0] * Math.PI) / 512,
    (-pose.rotation[2] * Math.PI) / 512,
    'YXZ',
  );
  const transform = (local: Vector): Vector => {
    const p = new Vector3(...local).applyEuler(rotation);
    return displayPoint(p.toArray().map((n, i) => n + pose.position[i] / 64));
  };
  const up = new Vector3(0, 1, 0).applyEuler(rotation);
  if(view==='cockpit'){
    const offset=cockpitEyeOffset(pose.rotation.map(Math.round) as Vector,carHeight);
    const position=displayPoint(offset.map((n,i)=>n+pose.position[i]/64));
    const forward=displayPoint(new Vector3(0,0,300).applyEuler(rotation).toArray());
    return {position,target:position.map((n,i)=>n+forward[i]) as Vector,up:displayPoint(up.toArray())};
  }
  const t=rolloutProgress===undefined?1:Math.min(1,Math.max(0,(rolloutProgress-0.3)/0.7));
  const blend=t*t*t*(t*(t*6-15)+10);
  const rearT=rolloutProgress===undefined?1:Math.min(1,Math.max(0,(rolloutProgress-0.5)/0.5));
  const rearBlend=rearT*rearT*rearT*(rearT*(rearT*6-15)+10);
  const departure=rolloutProgress===undefined?1:Math.min(1,Math.max(0,(rolloutProgress-1)*1.5));
  const departureBlend=departure*departure*(3-2*departure);
  const behind=70+120*departureBlend;
  const stoppedHeight=fullSizeCar?130:88;
  return {
    position: transform([260*(1-blend), stoppedHeight+(170-stoppedHeight)*(1-blend)-(stoppedHeight-88)*departureBlend, -behind+(140+behind)*(1-rearBlend)]),
    target: transform([0, 12, (fullSizeCar?0:30)+(fullSizeCar?100:70)*departureBlend]),
    up: displayPoint(up.toArray()),
  };
}
