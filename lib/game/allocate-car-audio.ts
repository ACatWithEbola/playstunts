import {allocateEffectVoice} from './effect-allocation.ts';
import {initializeCarAudio} from './initialize-car-audio.ts';
/** Original resolved-resource allocation19066..1931d and effect reservation2928a. */
export function allocateCarAudio(before:{cars:Uint8Array[];timers:Uint8Array[];busy:number[]},descriptor:Uint8Array,instrument:Uint8Array){
 if(before.cars.length!==25||before.timers.length!==24||before.busy.length<24)throw Error('Invalid original audio allocation tables');
 const handle=before.cars.findIndex(c=>c[0]===0);
 if(handle<0)throw Error('Original car audio table exhausted');
 const timer=allocateEffectVoice(before.timers.slice(16).map((t,i)=>({resource:new DataView(t.buffer,t.byteOffset,t.byteLength).getUint32(0,true),busy:before.busy[i+16]})));
 const cars=before.cars.map(c=>c.slice()),timers=before.timers.map(t=>t.slice()),busy=[...before.busy];
 if(timer>=0){busy[timer]=1;timers[timer][0x24]=127;}
 cars[handle]=initializeCarAudio(cars[handle],descriptor,instrument,timer);
 return {cars,timers,busy,handle};
}
