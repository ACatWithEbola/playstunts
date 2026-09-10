import {updateOriginalPcSpeakerEngineLive} from './pc-speaker-engine-live.ts';
import {startOriginalPcSpeakerEngine,type OriginalPcSpeakerEngineState} from './pc-speaker-engine-start.ts';
import {stopOriginalPcSpeakerEffect} from './pc-speaker-effect-stop.ts';
import {effectFinished} from './effect-finished.ts';
/** Full player car callback including the original deferred transition at
 * 0x194d6-0x19535. Smoothing precedes effect cleanup or engine restart.
 */
export function updateOriginalPcSpeakerCarAudio<T extends OriginalPcSpeakerEngineState&{markers:Uint8Array}>(before:T,enabled:boolean,master:number,instrumentAt:(offset:number,segment:number)=>Uint8Array){
 const pending=before.car[27];const car=before.car.slice();car[27]=0;
 const smooth=updateOriginalPcSpeakerEngineLive({...before,car},enabled);
 let state={...before,...smooth};state.car[27]=pending;
 const writes=smooth.writes.slice();
 if(enabled&&state.car[0]&&pending){
  const v=new DataView(state.car.buffer),handle=v.getUint16(20,true);
  if(state.car[1]){
   const stopped=stopOriginalPcSpeakerEffect(state,handle,master);state={...state,...stopped};writes.push(...stopped.writes);state.car[27]=0;
  }else if(effectFinished(state.timers,handle,1)){
   const started=startOriginalPcSpeakerEngine(state,instrumentAt(v.getUint16(0x24,true),v.getUint16(0x26,true)));
   state={...state,...started};writes.push(...started.writes);state.car[27]=0;
  }
 }
 return {...state,writes};
}
