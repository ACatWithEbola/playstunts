import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
import {updateOriginalTandyEngineLive} from './tandy-engine-live.ts';
import {startOriginalTandyEngine,type OriginalTandyEngineState} from './tandy-engine-start.ts';
import {stopOriginalTandyEffect} from './tandy-effect-stop.ts';
import {effectFinished} from './effect-finished.ts';
/** Full player car callback including the original deferred transition at
 * 0x194d6-0x19535. Smoothing precedes effect cleanup or engine restart.
 */
export function updateOriginalTandyCarAudio<T extends OriginalTandyEngineState&{markers:Uint8Array}>(before:T,enabled:boolean,master:number,instrumentAt:(offset:number,segment:number)=>Uint8Array,driverSegment:number,port61:number){
 const pending=before.car[27];const car=before.car.slice();car[27]=0;
 const smooth=updateOriginalTandyEngineLive({...before,car},enabled);
 let state={...before,...smooth};state.car[27]=pending;
 const writes=smooth.writes.slice(),bios:OriginalTandyBiosSound[]=[];
 if(enabled&&state.car[0]&&pending){
  const v=new DataView(state.car.buffer),handle=v.getUint16(20,true);
  if(state.car[1]){
   const stopped=stopOriginalTandyEffect(state,handle,master,driverSegment,port61);state={...state,...stopped};writes.push(...stopped.writes);bios.push(...stopped.bios);state.car[27]=0;
  }else if(effectFinished(state.timers,handle,1)){
   const started=startOriginalTandyEngine(state,instrumentAt(v.getUint16(0x24,true),v.getUint16(0x26,true)),driverSegment,port61);
   state={...state,...started};writes.push(...started.writes);bios.push(...started.bios);state.car[27]=0;
  }
 }
 return {...state,writes,bios};
}
