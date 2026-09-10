import {updateOriginalMt32EngineLive} from './mt32-engine-live.ts';
import {startOriginalMt32Engine,type OriginalMt32EngineState} from './mt32-engine-start.ts';
import {stopOriginalMt32Effect} from './mt32-effect-stop.ts';
import {effectFinished} from './effect-finished.ts';
/** Full player car callback including the original deferred transition at
 * 0x194d6-0x19535. Smoothing precedes effect cleanup or engine restart.
 */
export function updateOriginalMt32CarAudio<T extends OriginalMt32EngineState&{markers:Uint8Array}>(before:T,enabled:boolean,master:number,instrumentAt:(offset:number,segment:number)=>Uint8Array){
 const pending=before.car[27];const car=before.car.slice();car[27]=0;
 const smooth=updateOriginalMt32EngineLive({...before,car},enabled);
 let state={...before,...smooth};state.car[27]=pending;
 const writes=smooth.writes.slice();
 if(enabled&&state.car[0]&&pending){
  const v=new DataView(state.car.buffer),handle=v.getUint16(20,true);
  if(state.car[1]){
   const stopped=stopOriginalMt32Effect(state,handle,master);state={...state,...stopped};writes.push(...stopped.writes);state.car[27]=0;
  }else if(effectFinished(state.timers,handle,1)){
   const started=startOriginalMt32Engine(state,instrumentAt(v.getUint16(0x24,true),v.getUint16(0x26,true)));
   state={...state,...started};writes.push(...started.writes);state.car[27]=0;
  }
 }
 return {...state,writes};
}
