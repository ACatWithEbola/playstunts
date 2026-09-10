import {startEngineAudio} from './engine-start.ts';
import {startAdlibNote,ADLIB_CHANNEL_MASKS} from './adlib-note-start.ts';
import {adlibInstrument} from './adlib.ts';
import {adlibVolume} from './adlib-volume.ts';
import type {EffectRuntimeState} from './effect-runtime.ts';
const view=(b:Uint8Array)=>new DataView(b.buffer,b.byteOffset,b.byteLength);
export interface EngineRuntimeStartState extends EffectRuntimeState {car:Uint8Array;command:Uint8Array}
/** Engine wrapper plus original instrument assignment, continuous-note helper
 * and initial volume update. Regular melodic AdLib output only.
 */
export function startEngineRuntime(before:EngineRuntimeStartState,instrument:Uint8Array){
 let timers=before.timers.map(t=>t.slice()),voices=before.voices.map(v=>v.slice()),lastNotes=before.lastNotes.slice(),velocities=before.velocities.slice();
 const command=before.command.slice(),writes:number[][]=[],patch=Array.from(instrument);
 if(command.length!==10||instrument.length<100)throw Error('Missing original engine command or patch');
 const car=startEngineAudio(before.car,instrument,call=>{
  if(call.kind==='instrument'){
   const [owner,offset,segment]=call.args,timer=timers[owner];
   view(timer).setUint16(0x1e,offset,true);view(timer).setUint16(0x20,segment,true);
   timer[0x47]=instrument[0x43]<16?instrument[0x43]:(owner&15)+1;
   for(let i=1;i<voices.length;i++)if(voices[i][0]===owner){
    for(const [field,control] of [[0x29,0x16],[0x2b,0x17],[0x2c,0x18]])if(timer[field]&&patch[control]>=129&&patch[control]<=133)throw Error('Unreconstructed engine instrument controller');
    writes.push(...adlibInstrument(patch,i-1));
   }
  }else if(call.kind==='note'){
   const [pitch,owner]=call.args,c=view(command);c.setUint32(0,pitch,true);command[4]=255;c.setUint32(6,0xffffffe0,true);
   // Original helper leaves command byte 5 unchanged.
   const started=startAdlibNote({alternate:false,channelMasks:Array.from(ADLIB_CHANNEL_MASKS),owner,instrument,timers,voices,lastNotes,command},{driverSegment:before.driverSegment,velocities});
   ({timers,voices,lastNotes,velocities}=started);writes.push(...started.writes);return started.voice;
  }else{
   const [owner,volume]=call.args;timers[owner][0x28]=volume;
   for(let i=1;i<voices.length;i++)if(voices[i][0]===owner){
    const r=view(voices[i]),t=view(timers[owner]);
    if(r.getUint32(16,true)!==t.getUint32(0x1e,true))throw Error('Engine volume requires the stored original instrument');
    writes.push(...adlibVolume(patch,i-1,volume,velocities[i-1]));
   }
  }
 });
 return {car,timers,voices,lastNotes,velocities,command,writes,driverSegment:before.driverSegment};
}
