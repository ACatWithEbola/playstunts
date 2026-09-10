import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
import {skidAudio} from './skid-audio.ts';
import {startEffect} from './effect-start.ts';
import {stopOriginalTandyEffect} from './tandy-effect-stop.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';
import type {CarEffectState} from './crash-runtime.ts';
import type {OriginalTandyEffectState} from './tandy-effect-runtime.ts';
/** Original skid wrappers composed with logical-effect allocation and cleanup. */
export function updateOriginalTandySkid<T extends CarEffectState&OriginalTandyEffectState>(before:T,variant:1|2|'stop',resources:LoadedEffectResource[],enabled:boolean,master:number,driverSegment:number,port61:number){
 let state:T={...before};const writes:number[][]=[],bios:OriginalTandyBiosSound[]=[];
 const car=skidAudio(before.car,variant,args=>{
  const [offset,segment,requested,priority,volume]=args;
  const resource=resources.find(r=>r.headerOffset===offset&&r.headerSegment===segment);
  if(!resource)throw Error('Missing original skid effect resource');
  const started=startEffect({...resource,enabled,master,requested:requested===65535?-1:requested,priority,volume,timers:state.timers,lastNotes:state.lastNotes,markers:state.markers,busy:state.busy});
  state={...state,...started};return started.voice;
 },handle=>{
  const stopped=stopOriginalTandyEffect(state,handle,master,driverSegment,port61);state={...state,...stopped};writes.push(...stopped.writes);bios.push(...stopped.bios);for(const [port,value] of stopped.writes)if(port===0x61)port61=value;
 });
 return {...state,car,writes,bios};
}
