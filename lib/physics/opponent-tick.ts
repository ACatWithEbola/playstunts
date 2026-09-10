import {opponentDrivingStep} from './opponent-driving-step.ts';
import {opponentRaceStep} from './opponent-race-step.ts';
export interface OpponentRaceContext {
 previousAngle:number; startX:number; startZ:number; startAngle:number;
 raceWords:number[]; savedRaceWords:number[]; timeAdjustment:number; flags:number;
}
/** Original opponent controls, movement and race tail. Shared collision events remain caller-owned. */
export function opponentTick(args:Parameters<typeof opponentDrivingStep>,race:OpponentRaceContext){
 const movement=opponentDrivingStep(...args);
 const raceWords=[...race.raceWords];
 // Engine routine 0xa57f..0xa58d updates the shared unsigned peak road speed.
 raceWords[9]=Math.max(raceWords[9]&65535,movement.engineRoadSpeed&65535);
 const tail=opponentRaceStep([movement.pose.position,movement.pose.rotation,movement.decision.routeTarget.midpoint,movement.grip.crash,movement.decision.route.completed,race.previousAngle,race.startX,race.startZ,race.startAngle],raceWords,race.savedRaceWords,race.timeAdjustment,race.flags);
 return {...movement,grip:{...movement.grip,crash:tail.status},race:tail};
}
