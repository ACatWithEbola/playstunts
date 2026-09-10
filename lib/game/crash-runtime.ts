import {crashAudio} from './crash-audio.ts';
import {startEffect} from './effect-start.ts';
import type {EffectRuntimeState,LoadedEffectResource} from './effect-runtime.ts';
export interface CarEffectState {car:Uint8Array;timers:Uint8Array[];voices:Uint8Array[];lastNotes:Uint8Array;markers:Uint8Array;busy:number[]}
export interface CrashRuntimeState extends EffectRuntimeState,CarEffectState {}
/** Original 0x1971e: allocate effect before setting the engine note's remaining
 * duration to one (0x29e64). Release occurs in later audio callbacks.
 */
export function startCrashRuntime<T extends CarEffectState>(before:T,resources:LoadedEffectResource[],enabled:boolean,master:number){
 let timers=before.timers.map(t=>t.slice()),lastNotes=before.lastNotes.slice(),markers=before.markers.slice();
 const voices=before.voices.map(v=>v.slice());
 const car=crashAudio(before.car,args=>{
  const [offset,segment,requested,priority,volume]=args;
  const resource=resources.find(r=>r.headerOffset===offset&&r.headerSegment===segment);
  if(!resource)throw Error('Missing original crash effect resource');
  const started=startEffect({...resource,enabled,master,requested:requested===65535?-1:requested,priority,volume,timers,lastNotes,markers,busy:before.busy});
  ({timers,lastNotes,markers}=started);return started.voice;
 },voice=>{
  if(!voices[voice])throw Error('Missing original engine voice to stop');
  new DataView(voices[voice].buffer).setUint32(12,1,true);
 });
 return {...before,car,timers,voices,lastNotes,markers,writes:[] as number[][]};
}
