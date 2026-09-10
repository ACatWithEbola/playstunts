import {advanceRaceClock} from './race-clock.ts';
import {stepSinglePlayerRaceFrame} from './single-player-race-frame.ts';
import type {stepPlayerDriving} from './player-driving-step.ts';
/** Active player-only race: advance the original clock before driving/camera/effects. */
export function stepSinglePlayerRaceTick(before:Parameters<typeof stepSinglePlayerRaceFrame>[0]&{done:number;mode:number},trackside:Parameters<typeof stepSinglePlayerRaceFrame>[1],tuning:Parameters<typeof stepPlayerDriving>[1],wheels:Parameters<typeof stepPlayerDriving>[2],input:number,track:Parameters<typeof stepPlayerDriving>[4],...route:Parameters<typeof stepPlayerDriving> extends [unknown,unknown,unknown,unknown,unknown,unknown,...infer Rest]?Rest:never){
 const race=before.player.driving.race,car=before.player.driving.car;
 const clock=advanceRaceClock({frame:race.stats[2],counter:race.abortFlag,timer:race.timer,evaluationCause:race.evaluationCause,done:before.done,mode:before.mode,crash:car.grip.crash,roadSpeed:car.engine.roadSpeed});
 const stats=[...race.stats];stats[2]=clock.frame;
 const player={...before.player,driving:{...before.player.driving,race:{...race,stats,abortFlag:clock.counter,timer:clock.timer}}};
 return {...stepSinglePlayerRaceFrame({player,camera:before.camera},trackside,tuning,wheels,input,track,clock.frame,...route),done:clock.done,mode:before.mode};
}
