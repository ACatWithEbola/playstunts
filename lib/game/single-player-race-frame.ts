import {stepPlayerDriving,type PlayerDrivingState} from './player-driving-step.ts';
import {raceCameraStep} from '../physics/race-camera-step.ts';
import type {RaceCameraState} from '../physics/race-cameras.ts';
import {advanceParticles} from './particles.ts';
import type {Vector} from '../physics/math.ts';
/** Player-only race update: player, original camera, then shared particle advance. */
export function stepSinglePlayerRaceFrame(before:{player:PlayerDrivingState;camera:RaceCameraState},trackside:Vector[],...args:Parameters<typeof stepPlayerDriving> extends [unknown,...infer Rest]?Rest:never){
 const player=stepPlayerDriving(before.player,...args),g=player.navigation.guidance;
 const camera=raceCameraStep(before.camera.position,{position:player.driving.car.pose.position,target:g.target,angle:g.angle,routeIndex:g.routeIndex,field9e:g.wheelAngle,crash:player.driving.car.grip.crash},args[4],trackside,before.camera.selected,!!(player.navigation.progress.status||player.navigation.progress.confirmations));
 const particles=player.driving.particles.active?advanceParticles(player.driving.particles,player.driving.car.pose.position[1]):player.driving.particles;
 return {player:{...player,driving:{...player.driving,particles}},camera};
}
