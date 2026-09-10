import {stepCarAudioTick} from './car-audio-tick.ts';
import {adlibPitch} from './adlib.ts';
import {adlibVolume} from './adlib-volume.ts';
import type {EngineRuntimeStartState} from './engine-runtime-start.ts';
const view=(b:Uint8Array)=>new DataView(b.buffer,b.byteOffset,b.byteLength);
/** Running-engine car iteration with live AD15 volume/pitch operations.
 * Startup/stop transitions remain explicit unsupported requests in this adapter.
 */
export function updateEngineLive(before:EngineRuntimeStartState,enabled:boolean,instrumentAt:(offset:number,segment:number)=>Uint8Array){
 const update=stepCarAudioTick(before.car,enabled,false,0);
 const timers=before.timers.map(t=>t.slice()),voices=before.voices.map(v=>v.slice()),writes:number[][]=[];
 for(const call of update.calls){
  if(call.kind==='volume'){
   const [owner,volume]=call.args;
   if(!timers[owner])throw Error('Missing original live-volume timer');
   timers[owner][0x28]=volume;
   for(let index=1;index<voices.length;index++)if(voices[index][0]===owner){
    const v=view(voices[index]),instrument=instrumentAt(v.getUint16(16,true),v.getUint16(18,true));
    writes.push(...adlibVolume(Array.from(instrument),index-1,volume,before.velocities[index-1]));
   }
  }else if(call.kind==='pitch'){
   const [index,frequency]=call.args,record=voices[index];
   if(!record)throw Error('Missing original live-pitch voice');
   if(record[0x2c]){const v=view(record),pitch=adlibPitch(frequency);v.setUint16(4,pitch,true);v.setUint16(6,pitch,true);}
  }else throw Error(`Engine transition ${call.kind} needs its original runtime adapter`);
 }
 return {...before,car:update.record,timers,voices,writes};
}
