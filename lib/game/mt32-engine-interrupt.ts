import {stepOriginalMt32Effects} from './mt32-effect-runtime.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';
import {updateOriginalMt32CarAudio} from './mt32-car-audio-runtime.ts';
import {carAudioCadence} from './car-audio-cadence.ts';
import type {OriginalMt32EngineState} from './mt32-engine-start.ts';
/** Captured registered IRQ order: 0x2a1f0 audio, then 0x193cd car audio.
 * Running player-engine scope; caller handles pause/reentry and other callbacks.
 */
export function stepOriginalMt32EngineInterrupt(before:OriginalMt32EngineState&{carCounter:number;markers:Uint8Array},resources:LoadedEffectResource[],enabled:boolean,master=127){
 const result=stepOriginalMt32CarInterrupt({...before,cars:[before.car]},resources,enabled,master);
 const {cars,...state}=result;
 return {...state,car:cars[0]};
}
/** Shared hardware IRQ followed by car records in original handle order. */
export function stepOriginalMt32CarInterrupt(before:OriginalMt32EngineState&{cars:Uint8Array[];carCounter:number;markers:Uint8Array},resources:LoadedEffectResource[],enabled:boolean,master=127){
 const audio=stepOriginalMt32Effects(before,resources);
 const result=stepOriginalMt32CarRecords({...before,...audio},resources,enabled,master);
 return {...result,writes:[...audio.writes,...result.writes]};
}
/** The separately registered 193cd callback; hardware voice timing has its
 * own driver/pause guard and must not be advanced here. */
export function stepOriginalMt32CarRecords(before:OriginalMt32EngineState&{cars:Uint8Array[];carCounter:number;markers:Uint8Array},resources:LoadedEffectResource[],enabled:boolean,master=127,stackMatches=true){
 if(before.cars.length>25)throw Error('Original car audio table contains at most 25 records');
 const cadence=carAudioCadence(before.carCounter,1,stackMatches);
 let state={...before,carCounter:cadence.counter};
 const cars=before.cars.map(car=>car.slice()),writes:number[][]=[];
 for(const handle of cadence.handles){
  if(!cars[handle])continue;
  const updated=updateOriginalMt32CarAudio({...state,car:cars[handle]},enabled,master,(offset,segment)=>{
   const resource=resources.find(r=>r.instrumentOffset===offset&&r.instrumentSegment===segment);
   if(!resource)throw Error('Missing original IRQ instrument');
   return resource.instrument;
  });
  cars[handle]=updated.car;state={...state,...updated};writes.push(...updated.writes);
 }
 return {...state,cars,writes};
}
