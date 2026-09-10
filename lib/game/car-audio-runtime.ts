import {updateEngineLive} from './engine-live.ts';
import {startEngineRuntime,type EngineRuntimeStartState} from './engine-runtime-start.ts';
import {stopEffect} from './effect-stop.ts';
import {effectFinished} from './effect-finished.ts';
/** Full player car callback including the original deferred transition at
 * 0x194d6-0x19535. Smoothing precedes effect cleanup or engine restart.
 */
export function updateCarAudioRuntime<T extends EngineRuntimeStartState&{markers:Uint8Array}>(before:T,enabled:boolean,master:number,instrumentAt:(offset:number,segment:number)=>Uint8Array){
 const pending=before.car[27];const car=before.car.slice();car[27]=0;
 const smooth=updateEngineLive({...before,car},enabled,instrumentAt);
 let state={...before,...smooth};state.car[27]=pending;
 const writes=smooth.writes.slice();
 if(enabled&&state.car[0]&&pending){
  const v=new DataView(state.car.buffer),handle=v.getUint16(20,true);
  if(state.car[1]){
   const stopped=stopEffect(state,handle,master);state={...state,...stopped};writes.push(...stopped.writes);state.car[27]=0;
  }else if(effectFinished(state.timers,handle,1)){
   const started=startEngineRuntime(state,instrumentAt(v.getUint16(0x24,true),v.getUint16(0x26,true)));
   state={...state,...started};writes.push(...started.writes);state.car[27]=0;
  }
 }
 return {...state,writes};
}
