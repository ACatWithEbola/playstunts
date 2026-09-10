import {updateDrivingSoundFlags} from './driving-sound-flags.ts';
import {startEngineRuntime,type EngineRuntimeStartState} from './engine-runtime-start.ts';
import {stopEngineRuntime} from './engine-runtime-stop.ts';
import {updateSkidRuntime} from './skid-runtime.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';
export type DrivingSoundState=EngineRuntimeStartState&{markers:Uint8Array;busy:number[];soundFlags:number};
/** Original producer's per-car sound transitions. Sample writing precedes
 * this call; the producer commits its queue index after this call.
 */
export function updateDrivingSoundRuntime(before:DrivingSoundState,current:number,resources:LoadedEffectResource[],enabled:boolean,master:number){
 const transition=updateDrivingSoundFlags(before.soundFlags,current);
 let state:DrivingSoundState={...before};const writes:number[][]=[];
 for(const request of transition.requests){
  if(request==='engine-start'){
   const view=new DataView(state.car.buffer,state.car.byteOffset,state.car.byteLength);
   const offset=view.getUint16(0x24,true),segment=view.getUint16(0x26,true);
   const resource=resources.find(r=>r.instrumentOffset===offset&&r.instrumentSegment===segment);
   if(!resource)throw Error('Missing original engine instrument');
   const next=startEngineRuntime(state,resource.instrument);state={...state,...next};writes.push(...next.writes);
  }else if(request==='engine-stop'){
   const next=stopEngineRuntime(state);state={...state,...next};writes.push(...next.writes);
  }else{
   const next=updateSkidRuntime(state,request==='skid-start'?1:request==='skid2-start'?2:'stop',resources,enabled,master);
   state={...state,...next};writes.push(...next.writes);
  }
 }
 return {...state,soundFlags:transition.flags,writes};
}
