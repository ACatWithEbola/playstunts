/** Verified single-player driving and crash-effects order. This is not yet the
 * full race loop: opponent updates, race timers and presentation are pending. */
import {stepTrack} from '../physics/track-step.ts';
import type {LevelState} from '../physics/level-step.ts';
import type {EngineTuning} from '../physics/engine.ts';
import type {GripTuning} from '../physics/grip.ts';
import type {Vector} from '../physics/math.ts';
import type {TrackGeometry} from '../physics/track-contact.ts';
import {updateCrashState,type CrashRaceState,type CrashEffect} from './crash-state.ts';
import {generateParticles,advanceParticles,type Particles} from './particles.ts';
export interface DrivingState {car:LevelState;race:CrashRaceState;particles:Particles}
export function stepDrivingCar(before:DrivingState,tuning:EngineTuning&GripTuning,wheels:Vector[],input:number,track:TrackGeometry,frame:number){
 const car=stepTrack(before.car,tuning,wheels,input,track);
 let race={...before.race,stats:[...before.race.stats]},particles=before.particles;
 race.stats[2]=frame&65535;
 race.stats[9]=Math.max(race.stats[9],car.engineRoadSpeed);
 const effects:CrashEffect[]=[];
 for(const impact of car.crashImpacts){
  const transition=updateCrashState({...race,crash:before.car.grip.crash,speed:before.car.engine.speed,roadSpeed:impact.roadSpeed,yaw:impact.yaw},impact.cause,0);
  race=transition.state;
  for(const effect of transition.effects){
   effects.push(effect);
   if(effect.type==='particles')particles=generateParticles(particles,effect.car,effect.yaw,effect.mode);
  }
 }
 if(before.car.engine.allContact!==0 && car.engine.allContact===0)race.stats[10]=(race.stats[10]+1)&65535;
 const accumulated=(race.stats[0]+race.stats[1]*65536+car.engine.roadSpeed)>>>0;
 race.stats[0]=accumulated&65535;race.stats[1]=accumulated>>>16;
 race={...race,crash:car.grip.crash,speed:car.engine.speed,roadSpeed:car.engine.roadSpeed,yaw:car.pose.rotation[0]};
 return {car,race,particles,effects};
}

/** Single-player test wrapper. A complete race uses stepDrivingCar and advances
 * particles once in the shared stage after both cars and the cameras. */
export function stepDriving(...args:Parameters<typeof stepDrivingCar>){
 const result=stepDrivingCar(...args);
 return {...result,particles:result.particles.active?advanceParticles(result.particles,result.car.pose.position[1]):result.particles};
}
