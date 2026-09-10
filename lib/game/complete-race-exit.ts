import {finishNativeRace,type NativeRaceExitHost} from './native-race-exit.ts';
import {freeCompleteNativeRaceResources} from './complete-race-resource-cleanup.ts';
import {removeOriginalAudioTimer} from './remove-audio-timer.ts';
import {removeNativeRaceFrameTimer} from './remove-race-frame-timer.ts';

export interface CompleteRaceExitHost extends Omit<NativeRaceExitHost,'removeAudioTimer'|'removeFrameCallback'|'freeCars'> {
 writeMemory(memory:Uint8Array):void;
 stopEffect(handle:number):void;
 gameCounter():Promise<number>;
}
/** Joined original exit. Requires the caller's live allocation graph and
 * sprite-window stack; a stripped startup snapshot is not sufficient. */
export async function finishCompleteNativeRace(host:CompleteRaceExitHost,d:number,graphicsCodeBase:number){
 await finishNativeRace({...host,
  removeAudioTimer:()=>removeOriginalAudioTimer(host,d),
  removeFrameCallback:()=>removeNativeRaceFrameTimer(host,d),
  freeCars:()=>freeCompleteNativeRaceResources(host,d,graphicsCodeBase),
 },d);
}
