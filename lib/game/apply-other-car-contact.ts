import type {LevelState} from '../physics/level-step.ts';
import type {RaceContactCar} from '../physics/race-car-contact.ts';
import {updateCrashState,type CrashEffect,type CrashRaceState} from './crash-state.ts';
import {generateParticles,type Particles} from './particles.ts';
/** Apply cross-car writes and the second original crash request immediately. */
export function applyOtherCarContact(before:LevelState,contact:RaceContactCar|undefined,crash:boolean,selected:0|1,shared:{race:CrashRaceState;particles:Particles}){
 let car=before,race=shared.race,particles=shared.particles;const effects:CrashEffect[]=[];
 if(contact)car={...car,engine:{...car.engine,speed:contact.speed,roadSpeed:contact.roadSpeed},grip:{...car.grip,speed:contact.speed,roadSpeed:contact.roadSpeed,wheelAngle:contact.wheelAngle},contactFlag:contact.contact};
 if(crash){
  const transition=updateCrashState({...race,crash:car.grip.crash,speed:car.engine.speed,roadSpeed:car.engine.roadSpeed,yaw:car.pose.rotation[0]},1,selected);
  race=selected?{...transition.state,crash:race.crash,speed:race.speed,roadSpeed:race.roadSpeed,yaw:race.yaw}:transition.state;
  car={...car,engine:{...car.engine,speed:transition.state.speed,roadSpeed:transition.state.roadSpeed},grip:{...car.grip,crash:transition.state.crash,speed:transition.state.speed,roadSpeed:transition.state.roadSpeed}};
  for(const effect of transition.effects){effects.push(effect);if(effect.type==='particles')particles=generateParticles(particles,effect.car,effect.yaw,effect.mode);}
 }
 if(!selected)race={...race,crash:car.grip.crash,speed:car.engine.speed,roadSpeed:car.engine.roadSpeed,yaw:car.pose.rotation[0]};
 return {car,race,particles,effects};
}
