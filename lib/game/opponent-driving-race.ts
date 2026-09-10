import {opponentDrivingStep} from '../physics/opponent-driving-step.ts';
import {opponentRaceStep} from '../physics/opponent-race-step.ts';
import type {OpponentRaceContext} from '../physics/opponent-tick.ts';
import {updateCrashState,type CrashEffect,type CrashRaceState} from './crash-state.ts';
import {generateParticles,type Particles} from './particles.ts';
/** Opponent movement and race tail with shared crash effects before the tail.
 * The shared race's car-specific fields continue to describe the player.
 */
export function stepOpponentDrivingRace(args:Parameters<typeof opponentDrivingStep>,context:OpponentRaceContext,shared:{race:CrashRaceState;particles:Particles}){
 const movement=opponentDrivingStep(...args),before=args[0];
 let race={...shared.race,stats:[...shared.race.stats]},particles=shared.particles;
 race.stats[9]=Math.max(race.stats[9]&65535,movement.engineRoadSpeed&65535);
 const effects:CrashEffect[]=[];
 for(const impact of movement.crashImpacts){
  const transition=updateCrashState({...race,crash:before.grip.crash,speed:before.engine.speed,roadSpeed:impact.roadSpeed,yaw:impact.yaw},impact.cause,1);
  race={...transition.state,crash:shared.race.crash,speed:shared.race.speed,roadSpeed:shared.race.roadSpeed,yaw:shared.race.yaw};
  for(const effect of transition.effects){effects.push(effect);if(effect.type==='particles')particles=generateParticles(particles,effect.car,effect.yaw,effect.mode);}
 }
 const tail=opponentRaceStep([movement.pose.position,movement.pose.rotation,movement.decision.routeTarget.midpoint,movement.grip.crash,movement.decision.route.completed,context.previousAngle,context.startX,context.startZ,context.startAngle],race.stats,race.savedStats,context.timeAdjustment,context.flags);
 race={...race,stats:tail.raceWords,savedStats:tail.savedRaceWords};
 return {car:{...movement,grip:{...movement.grip,crash:tail.status}},tail,race,particles,effects};
}
