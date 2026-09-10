import {startEffect} from './effect-start.ts';
import type {CarEffectState} from './crash-runtime.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';
/** Original 0xaa92 dispatch, then scrape 0x1979e and bump 0x19762.
 * Both flags dispatch independently, scrape first. No previous effect stop.
 */
export function impactAudioRuntime<T extends CarEffectState>(before:T,flags:number,active:boolean,resources:LoadedEffectResource[],enabled:boolean,master:number){
 let state:T={...before,car:before.car.slice()};
 if(active)for(const [bit,offset] of [[0x10,0x48],[0x20,0x44]]){
  if(!(flags&bit))continue;
  const v=new DataView(state.car.buffer),headerOffset=v.getUint16(offset,true),headerSegment=v.getUint16(offset+2,true);
  const resource=resources.find(r=>r.headerOffset===headerOffset&&r.headerSegment===headerSegment);
  if(!resource)throw Error('Missing original impact sound resource');
  const started=startEffect({...resource,enabled,master,requested:-1,priority:64,volume:v.getUint16(4,true)>>>4,timers:state.timers,lastNotes:state.lastNotes,markers:state.markers,busy:state.busy});
  state={...state,...started};v.setUint16(20,started.voice,true);state.car[26]=1;
 }
 return {...state,writes:[] as number[][]};
}
