import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
import {stepOriginalTandyEffects} from './tandy-effect-runtime.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';
import {runOriginalTandyCarAudio} from './tandy-car-audio-runtime.ts';
import {carAudioCadence} from './car-audio-cadence.ts';
import type {OriginalTandyEngineState,OriginalTandySampleResolver} from './tandy-engine-start.ts';
/** Captured registered IRQ order: 0x2a1f0 audio, then 0x193cd car audio.
 * Running player-engine scope; caller handles pause/reentry and other callbacks.
 */
export function stepOriginalTandyEngineInterrupt(before:OriginalTandyEngineState&{carCounter:number;markers:Uint8Array},resources:LoadedEffectResource[],enabled:boolean,port61:number,driverSegment:number,incomingCx:number,master=127){
 const result=stepOriginalTandyCarInterrupt({...before,cars:[before.car]},resources,enabled,port61,driverSegment,incomingCx,master);
 const {cars,...state}=result;
 return {...state,car:cars[0]};
}
/** Shared hardware IRQ followed by car records in original handle order. */
export function stepOriginalTandyCarInterrupt(before:OriginalTandyEngineState&{cars:Uint8Array[];carCounter:number;markers:Uint8Array},resources:LoadedEffectResource[],enabled:boolean,port61:number,driverSegment:number,incomingCx:number,master=127){
 const audio=stepOriginalTandyEffects(before,resources,port61,driverSegment,incomingCx);
 const result=stepOriginalTandyCarRecords({...before,...audio},resources,enabled,audio.port61,driverSegment,master);
 return {...result,writes:[...audio.writes,...result.writes],bios:[...audio.bios,...result.bios]};
}
/** The separately registered 193cd callback; hardware voice timing has its
 * own driver/pause guard and must not be advanced here. */
export function stepOriginalTandyCarRecords(before:OriginalTandyEngineState&{cars:Uint8Array[];carCounter:number;markers:Uint8Array},resources:LoadedEffectResource[],enabled:boolean,port61:number,driverSegment:number,master=127,stackMatches=true,sampleAt?:OriginalTandySampleResolver){
 const program=runOriginalTandyCarRecords(before,resources,enabled,port61,driverSegment,master,stackMatches,false,sampleAt);let step=program.next();while(!step.done)step=program.next();return step.value;
}
export function* runOriginalTandyCarRecords(before:OriginalTandyEngineState&{cars:Uint8Array[];carCounter:number;markers:Uint8Array},resources:LoadedEffectResource[],enabled:boolean,port61:number,driverSegment:number,master=127,stackMatches=true,deferLegacyBios=false,sampleAt?:OriginalTandySampleResolver){
 if(before.cars.length>25)throw Error('Original car audio table contains at most 25 records');
 const cadence=carAudioCadence(before.carCounter,0,stackMatches);
 let state={...before,carCounter:cadence.counter};
 const cars=before.cars.map(car=>car.slice()),writes:number[][]=[],bios:OriginalTandyBiosSound[]=[];
 for(const handle of cadence.handles){
  if(!cars[handle])continue;
  const program=runOriginalTandyCarAudio({...state,car:cars[handle]},enabled,master,(offset,segment)=>{
   const resource=resources.find(r=>r.instrumentOffset===offset&&r.instrumentSegment===segment);
   if(!resource)throw Error('Missing original IRQ instrument');
   return resource.instrument;
  },driverSegment,port61,deferLegacyBios,sampleAt);
  let step=program.next(),emittedWrites=0,emittedBios=0;
  try{while(!step.done){
   writes.push(...step.value.writes.slice(emittedWrites));bios.push(...step.value.bios.slice(emittedBios));emittedWrites=step.value.writes.length;emittedBios=step.value.bios.length;
   const reachedCars=cars.slice();reachedCars[handle]=step.value.state.car;
   const resumed:{driver:Uint8Array;port61:number}|undefined=yield {state:{...state,...step.value.state,cars:reachedCars},sampleStarts:[],writes:writes.map(write=>write.slice()),bios:bios.map(request=>({...request})),port61:step.value.port61};
   step=program.next(resumed);
  }}finally{program.return(undefined as never);}
  const updated=step.value;
  cars[handle]=updated.car;state={...state,...updated};writes.push(...updated.writes.slice(emittedWrites));bios.push(...updated.bios.slice(emittedBios));for(const [port,value] of updated.writes)if(port===0x61)port61=value;
 }
 return {...state,cars,writes,bios,port61};
}
