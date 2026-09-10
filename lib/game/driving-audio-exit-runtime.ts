import {drivingAudioExit,type DrivingAudioExitState} from './driving-audio-exit.ts';
import {stopEngineRuntime} from './engine-runtime-stop.ts';
import {updateSkidRuntime} from './skid-runtime.ts';
import {resetAudio} from './audio-reset.ts';
import type {DrivingSoundState} from './driving-sound-runtime.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';
/** Complete original exit path, single-player regular AdLib scope. */
export function exitDrivingAudio(before:DrivingSoundState&{paused:number},queue:DrivingAudioExitState,resources:LoadedEffectResource[],enabled:boolean,master:number){
 if(queue.opponentEnabled)throw Error('Opponent audio exit requires its car record');
 const exit=drivingAudioExit(queue);let state={...before};const writes:number[][]=[];
 for(const call of exit.calls){
  if(call.kind==='reset'){
   const next=resetAudio(state);state={...state,...next};writes.push(...next.writes);
  }else{
   if(call.handle!==queue.playerHandle)throw Error('Missing original exit car');
   const next=call.kind==='engine-stop'?stopEngineRuntime(state):updateSkidRuntime(state,'stop',resources,enabled,master);
   state={...state,...next};writes.push(...next.writes);
  }
 }
 return {audio:{...state,soundFlags:exit.state.playerFlags,writes},queue:exit.state};
}
