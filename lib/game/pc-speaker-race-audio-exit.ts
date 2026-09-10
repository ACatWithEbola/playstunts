import {drivingAudioExit,type DrivingAudioExitState} from './driving-audio-exit.ts';
import {stopEngineRuntime} from './engine-runtime-stop.ts';
import {updateOriginalPcSpeakerSkid} from './pc-speaker-skid-runtime.ts';
import {resetOriginalPcSpeakerAudio} from './pc-speaker-audio-reset.ts';
import type {OriginalPcSpeakerRaceState} from './pc-speaker-race-audio.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';
/** Original a67f..a6ee for both selected car handles, then shared driver reset. */
export function exitOriginalPcSpeakerRaceAudio(before:OriginalPcSpeakerRaceState&{paused:number},queue:DrivingAudioExitState,resources:LoadedEffectResource[],enabled:boolean,master:number,port61:number){
 const exit=drivingAudioExit(queue);let state=structuredClone(before);const writes:number[][]=[];
 for(const call of exit.calls){
  if(call.kind==='reset'){
   const {writes:resetWrites,...next}=resetOriginalPcSpeakerAudio(state,port61);state=next;writes.push(...resetWrites);
  }else{
   const handle=call.handle!;const car=state.cars[handle];if(!car)throw Error('Missing original exit car');
   const next=call.kind==='engine-stop'?stopEngineRuntime({...state,car}):updateOriginalPcSpeakerSkid({...state,car},'stop',resources,enabled,master);
   const {car:updated,writes:carWrites,...shared}=next;
   const cars=state.cars.slice();cars[handle]=updated;state={...state,...shared,cars};writes.push(...carWrites);for(const [port,value] of carWrites)if(port===0x61)port61=value;
  }
 }
 state.soundFlags[queue.playerHandle]=exit.state.playerFlags;
 state.soundFlags[queue.opponentHandle]=exit.state.opponentFlags;
 return {audio:{...state,writes},queue:exit.state};
}
