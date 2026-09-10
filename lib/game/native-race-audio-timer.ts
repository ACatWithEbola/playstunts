import {readOriginalRaceAudioTargets} from './consume-race-audio.ts';
import {tickOriginalRaceTimer,type NativeRaceTimerHost} from './native-race-timer.ts';
import type {Vector} from '../physics/math.ts';
/** Registered hardware/car callbacks precede the complete race callback.
 * The race callback alone owns queue consumption and input-clock advancement. */
export function tickOriginalRaceAudioTimer(host:Omit<NativeRaceTimerHost,'audioSample'>,d:number,audio:{tick(stackMatches:boolean):number[][];update(handle:number,rpm:number,previous:Vector,current:Vector,interval:number):void}){
 const writes=audio.tick(host.stackMatches());
 tickOriginalRaceTimer({...host,audioSample(record,interval){
  for(const target of readOriginalRaceAudioTargets(host.memory(),d,record,interval))audio.update(target.handle,target.rpm,target.previous,target.current,target.interval);
 }},d);
 return writes;
}
