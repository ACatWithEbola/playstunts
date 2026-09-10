import {drivingAudioExit,type DrivingAudioExitState} from './driving-audio-exit.ts';
import {stopEngineRuntime} from './engine-runtime-stop.ts';
import {updateSkidRuntime} from './skid-runtime.ts';
import {resetAudio} from './audio-reset.ts';
import type {RaceAudioState} from './race-audio.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';
/** Original a67f..a6ee for both selected car handles, then shared driver reset. */
export function exitRaceAudio(before:RaceAudioState&{paused:number},queue:DrivingAudioExitState,resources:LoadedEffectResource[],enabled:boolean,master:number){
 const exit=drivingAudioExit(queue);let state=structuredClone(before);const writes:number[][]=[];
 for(const call of exit.calls){
  if(call.kind==='reset'){
   const {writes:resetWrites,...next}=resetAudio(state);state=next;writes.push(...resetWrites);
  }else{
   const handle=call.handle!;const car=state.cars[handle];if(!car)throw Error('Missing original exit car');
   const next=call.kind==='engine-stop'?stopEngineRuntime({...state,car}):updateSkidRuntime({...state,car},'stop',resources,enabled,master);
   const {car:updated,writes:carWrites,...shared}=next;
   const cars=state.cars.slice();cars[handle]=updated;state={...state,...shared,cars};writes.push(...carWrites);
  }
 }
 state.soundFlags[queue.playerHandle]=exit.state.playerFlags;
 state.soundFlags[queue.opponentHandle]=exit.state.opponentFlags;
 return {audio:{...state,writes},queue:exit.state};
}
