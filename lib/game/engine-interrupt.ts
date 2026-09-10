import {stepEffectRuntime,type LoadedEffectResource} from './effect-runtime.ts';
import {updateCarAudioRuntime} from './car-audio-runtime.ts';
import {carAudioCadence} from './car-audio-cadence.ts';
import type {EngineRuntimeStartState} from './engine-runtime-start.ts';
/** Captured registered IRQ order: 0x2a1f0 audio, then 0x193cd car audio.
 * Running player-engine scope; caller handles pause/reentry and other callbacks.
 */
export function stepEngineInterrupt(before:EngineRuntimeStartState&{carCounter:number;markers:Uint8Array},resources:LoadedEffectResource[],enabled:boolean,master=127){
 const result=stepCarAudioInterrupt({...before,cars:[before.car]},resources,enabled,master);
 const {cars,...state}=result;
 return {...state,car:cars[0]};
}
/** Shared hardware IRQ followed by car records in original handle order. */
export function stepCarAudioInterrupt(before:EngineRuntimeStartState&{cars:Uint8Array[];carCounter:number;markers:Uint8Array},resources:LoadedEffectResource[],enabled:boolean,master=127){
 const audio=stepEffectRuntime(before,resources);
 const result=stepCarAudioRecords({...before,...audio},resources,enabled,master);
 return {...result,writes:[...audio.writes,...result.writes]};
}
/** The separately registered 193cd callback; hardware voice timing has its
 * own driver/pause guard and must not be advanced here. */
export function stepCarAudioRecords(before:EngineRuntimeStartState&{cars:Uint8Array[];carCounter:number;markers:Uint8Array},resources:LoadedEffectResource[],enabled:boolean,master=127,stackMatches=true){
 if(before.cars.length>25)throw Error('Original car audio table contains at most 25 records');
 const cadence=carAudioCadence(before.carCounter,0,stackMatches);
 let state={...before,carCounter:cadence.counter};
 const cars=before.cars.map(car=>car.slice()),writes:number[][]=[];
 for(const handle of cadence.handles){
  if(!cars[handle])continue;
  const updated=updateCarAudioRuntime({...state,car:cars[handle]},enabled,master,(offset,segment)=>{
   const resource=resources.find(r=>r.instrumentOffset===offset&&r.instrumentSegment===segment);
   if(!resource)throw Error('Missing original IRQ instrument');
   return resource.instrument;
  });
  cars[handle]=updated.car;state={...state,...updated};writes.push(...updated.writes);
 }
 return {...state,cars,writes};
}
