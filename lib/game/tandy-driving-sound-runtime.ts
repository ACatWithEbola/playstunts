import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
import {updateDrivingSoundFlags} from './driving-sound-flags.ts';
import {startOriginalTandyEngine,type OriginalTandyEngineState} from './tandy-engine-start.ts';
import {stopEngineRuntime} from './engine-runtime-stop.ts';
import {updateOriginalTandySkid} from './tandy-skid-runtime.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';
export type OriginalTandyDrivingSoundState=OriginalTandyEngineState&{markers:Uint8Array;busy:number[];soundFlags:number};
/** Original producer's per-car sound transitions. Sample writing precedes
 * this call; the producer commits its queue index after this call.
 */
export function updateOriginalTandyDrivingSounds(before:OriginalTandyDrivingSoundState,current:number,resources:LoadedEffectResource[],enabled:boolean,master:number,driverSegment:number,port61:number){
 const transition=updateDrivingSoundFlags(before.soundFlags,current);
 let state:OriginalTandyDrivingSoundState={...before};const writes:number[][]=[],bios:OriginalTandyBiosSound[]=[];
 for(const request of transition.requests){
  if(request==='engine-start'){
   const view=new DataView(state.car.buffer,state.car.byteOffset,state.car.byteLength);
   const offset=view.getUint16(0x24,true),segment=view.getUint16(0x26,true);
   const resource=resources.find(r=>r.instrumentOffset===offset&&r.instrumentSegment===segment);
   if(!resource)throw Error('Missing original engine instrument');
   const next=startOriginalTandyEngine(state,resource.instrument,driverSegment,port61);state={...state,...next};writes.push(...next.writes);if('bios' in next)bios.push(...next.bios);for(const [port,value] of next.writes)if(port===0x61)port61=value;
  }else if(request==='engine-stop'){
   const next=stopEngineRuntime(state);state={...state,...next};writes.push(...next.writes);
  }else{
   const next=updateOriginalTandySkid(state,request==='skid-start'?1:request==='skid2-start'?2:'stop',resources,enabled,master,driverSegment,port61);
   state={...state,...next};writes.push(...next.writes);if('bios' in next)bios.push(...next.bios);for(const [port,value] of next.writes)if(port===0x61)port61=value;
  }
 }
 return {...state,soundFlags:transition.flags,writes,bios};
}
