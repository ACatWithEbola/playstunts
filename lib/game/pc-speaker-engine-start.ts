import {startEngineAudio} from './engine-start.ts';
import {startOriginalPcSpeakerNote} from './pc-speaker-note-start.ts';
import {setOriginalPcSpeakerVolume} from './pc-speaker-control.ts';
export interface OriginalPcSpeakerEngineState {car:Uint8Array;timers:Uint8Array[];voices:Uint8Array[];lastNotes:Uint8Array;command:Uint8Array;driver:Uint8Array;}
/** Original engine wrapper, continuous-note start and volume assignment with
 * PC15 callbacks. Instrument/controller assignment is a driver no-op. */
export function startOriginalPcSpeakerEngine(before:OriginalPcSpeakerEngineState,instrument:Uint8Array){
 let timers=before.timers.map(t=>t.slice()),voices=before.voices.map(v=>v.slice()),lastNotes=before.lastNotes.slice(),driver=before.driver.slice();const command=before.command.slice(),view=(b:Uint8Array)=>new DataView(b.buffer,b.byteOffset,b.byteLength);
 const car=startEngineAudio(before.car,instrument,call=>{
  if(call.kind==='instrument'){const [owner,offset,segment]=call.args,timer=timers[owner];view(timer).setUint16(0x1e,offset,true);view(timer).setUint16(0x20,segment,true);timer[0x47]=instrument[0x43]<16?instrument[0x43]:(owner&15)+1;}
  else if(call.kind==='note'){const [pitch,owner]=call.args,c=view(command);c.setUint32(0,pitch,true);command[4]=255;c.setUint32(6,0xffffffe0,true);const started=startOriginalPcSpeakerNote({alternate:false,channelMasks:[1,2,4,8,16],owner,instrument,timers,voices,lastNotes,command},driver);({timers,voices,lastNotes,driver}=started);return started.voice;}
  else{const [owner,volume]=call.args;timers[owner][0x28]=volume;for(let i=0;i<voices.length;i++)if(voices[i][0]===owner)setOriginalPcSpeakerVolume(driver,i,volume);}
 });
 return {car,timers,voices,lastNotes,driver,command,writes:[] as number[][]};
}
