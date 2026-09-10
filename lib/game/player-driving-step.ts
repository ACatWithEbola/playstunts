import {stepDrivingCar,type DrivingState} from './driving-step.ts';
import {playerRaceNavigation} from './player-race-navigation.ts';
import type {PlayerNavigationState} from '../physics/player-navigation.ts';
export interface PlayerDrivingState {driving:DrivingState;navigation:PlayerNavigationState}
/** Player update composition. Shared camera, particle advance and audio follow both cars. */
export function stepPlayerDriving(before:PlayerDrivingState,tuning:Parameters<typeof stepDrivingCar>[1],wheels:Parameters<typeof stepDrivingCar>[2],input:number,track:Parameters<typeof stepDrivingCar>[4],frame:number,...route:Parameters<typeof playerRaceNavigation> extends [unknown,unknown,...infer Rest]?Rest:never){
 const car=before.driving.car;
 const navigation={...before.navigation,progress:{...before.navigation.progress,penaltyDisplay:before.navigation.progress.penaltyDisplay?((before.navigation.progress.penaltyDisplay-1)&255):0}};
 // Original 9828 decrements the notice before the parked-crash early return.
 if(car.grip.crash&&car.engine.roadSpeed===0&&car.engine.speed===0&&car.suspension.rc1.every(n=>n===0)){
  return {driving:{...before.driving,car:{...car,grip:{...car.grip,soundFlags:0}}},navigation:{...navigation,guidance:{...navigation.guidance,warning:0}},effects:[],finish:false};
 }
 const moved=stepDrivingCar(before.driving,tuning,wheels,input,track,frame);
 const result=playerRaceNavigation(moved.race,{...navigation,guidance:{...navigation.guidance,position:moved.car.pose.position,rotation:moved.car.pose.rotation,crash:moved.car.grip.crash}},...route);
 return {driving:{car:{...moved.car,grip:{...moved.car.grip,crash:result.race.crash},engine:{...moved.car.engine,speed:result.race.speed,roadSpeed:result.race.roadSpeed}},race:result.race,particles:moved.particles},navigation:result.navigation,effects:moved.effects,finish:result.finish};
}
