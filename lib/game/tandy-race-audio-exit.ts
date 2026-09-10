import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
import {drivingAudioExit,type DrivingAudioExitState} from './driving-audio-exit.ts';
import {stopEngineRuntime} from './engine-runtime-stop.ts';
import {updateOriginalTandySkid} from './tandy-skid-runtime.ts';
import {resetOriginalTandyAudio} from './tandy-audio-reset.ts';
import type {OriginalTandyRaceState} from './tandy-race-audio.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';
/** Original a67f..a6ee for both selected car handles, then shared driver reset. */
export function exitOriginalTandyRaceAudio(before:OriginalTandyRaceState&{paused:number},queue:DrivingAudioExitState,resources:LoadedEffectResource[],enabled:boolean,master:number,port61:number,driverSegment:number){
 const exit=drivingAudioExit(queue);let state=structuredClone(before);const writes:number[][]=[],bios:OriginalTandyBiosSound[]=[];
 for(const call of exit.calls){
  if(call.kind==='reset'){
   const {writes:resetWrites,bios:resetBios,...next}=resetOriginalTandyAudio(state,port61,driverSegment);state=next;writes.push(...resetWrites);bios.push(...resetBios);
  }else{
   const handle=call.handle!;const car=state.cars[handle];if(!car)throw Error('Missing original exit car');
   const next=call.kind==='engine-stop'?stopEngineRuntime({...state,car}):updateOriginalTandySkid({...state,car},'stop',resources,enabled,master,driverSegment,port61);
   if(call.kind==='skid-stop'&&'bios' in next)bios.push(...next.bios);const {car:updated,writes:carWrites,...shared}=next;
   const cars=state.cars.slice();cars[handle]=updated;state={...state,...shared,cars};writes.push(...carWrites);for(const [port,value] of carWrites)if(port===0x61)port61=value;
  }
 }
 state.soundFlags[queue.playerHandle]=exit.state.playerFlags;
 state.soundFlags[queue.opponentHandle]=exit.state.opponentFlags;
 return {audio:{...state,writes,bios},queue:exit.state};
}
