import {skidAudio} from './skid-audio.ts';
import {startEffect} from './effect-start.ts';
import {stopEffect} from './effect-stop.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';
import type {CrashRuntimeState} from './crash-runtime.ts';
/** Original skid wrappers composed with logical-effect allocation and cleanup. */
export function updateSkidRuntime(before:CrashRuntimeState,variant:1|2|'stop',resources:LoadedEffectResource[],enabled:boolean,master:number){
 let state:CrashRuntimeState={...before};const writes:number[][]=[];
 const car=skidAudio(before.car,variant,args=>{
  const [offset,segment,requested,priority,volume]=args;
  const resource=resources.find(r=>r.headerOffset===offset&&r.headerSegment===segment);
  if(!resource)throw Error('Missing original skid effect resource');
  const started=startEffect({...resource,enabled,master,requested:requested===65535?-1:requested,priority,volume,timers:state.timers,lastNotes:state.lastNotes,markers:state.markers,busy:state.busy});
  state={...state,...started};return started.voice;
 },handle=>{
  const stopped=stopEffect(state,handle,master);state={...state,...stopped};writes.push(...stopped.writes);
 });
 return {...state,car,writes};
}
