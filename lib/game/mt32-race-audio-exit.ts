import {drivingAudioExit,type DrivingAudioExitState} from './driving-audio-exit.ts';
import {stopEngineRuntime} from './engine-runtime-stop.ts';
import {updateOriginalMt32Skid} from './mt32-skid-runtime.ts';
import {resetOriginalMt32Audio} from './mt32-audio-reset.ts';
import type {OriginalMt32RaceState} from './mt32-race-audio.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';
/** Original a67f..a6ee for both selected car handles, then shared driver reset. */
export function exitOriginalMt32RaceAudio(before:OriginalMt32RaceState&{paused:number},queue:DrivingAudioExitState,resources:LoadedEffectResource[],enabled:boolean,master:number){
 const exit=drivingAudioExit(queue);let state=structuredClone(before);const writes:number[][]=[];
 for(const call of exit.calls){
  if(call.kind==='reset'){
   const {writes:resetWrites,...next}=resetOriginalMt32Audio(state);state=next;writes.push(...resetWrites);
  }else{
   const handle=call.handle!;const car=state.cars[handle];if(!car)throw Error('Missing original exit car');
   const next=call.kind==='engine-stop'?stopEngineRuntime({...state,car}):updateOriginalMt32Skid({...state,car},'stop',resources,enabled,master);
   const {car:updated,writes:carWrites,...shared}=next;
   const cars=state.cars.slice();cars[handle]=updated;state={...state,...shared,cars};writes.push(...carWrites);
  }
 }
 state.soundFlags[queue.playerHandle]=exit.state.playerFlags;
 state.soundFlags[queue.opponentHandle]=exit.state.opponentFlags;
 return {audio:{...state,writes},queue:exit.state};
}
