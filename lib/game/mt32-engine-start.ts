import {startEngineAudio} from './engine-start.ts';
import {startOriginalMt32AllocatedNote} from './mt32-note-start.ts';
import {applyOriginalMt32DriverControl} from './mt32-driver-control.ts';
export interface OriginalMt32EngineState {car:Uint8Array;timers:Uint8Array[];voices:Uint8Array[];lastNotes:Uint8Array;command:Uint8Array;driver:Uint8Array}
/** Original1931E with alternate MT15 instrument assignment, continuous note
 * conversion and initial volume. MIDI bytes assume a ready output port. */
export function startOriginalMt32Engine(before:OriginalMt32EngineState,instrument:Uint8Array){
 let timers=before.timers.map(t=>t.slice()),voices=before.voices.map(v=>v.slice()),lastNotes=before.lastNotes.slice(),command=before.command.slice();
 const driver=before.driver.slice(),writes:number[][]=[],emptyVoice=new Uint8Array(46);
 const view=(b:Uint8Array)=>new DataView(b.buffer,b.byteOffset,b.byteLength);
 const car=startEngineAudio(before.car,instrument,call=>{
  if(call.kind==='instrument'){
   const [owner,offset,segment]=call.args,timer=timers[owner],v=view(timer);
   v.setUint16(0x1e,offset,true);v.setUint16(0x20,segment,true);timer[0x47]=instrument[67]<16?instrument[67]:(owner&15)+1;
   writes.push(...applyOriginalMt32DriverControl('instrument',timer[0x47],emptyVoice,instrument).writes);
  }else if(call.kind==='note'){
   const [pitch,owner]=call.args,c=view(command);c.setUint32(0,pitch,true);command[4]=255;c.setUint32(6,0xffffffe0,true);
   const next=startOriginalMt32AllocatedNote({alternate:true,channelMasks:[],owner,instrument,timers,voices,lastNotes,command});
   // Unlike regular output, the original alternate helper replaces the
   // continuous-note sentinel in shared command memory with MIDI note60.
   ({timers,voices,lastNotes,command}=next);writes.push(...next.writes);return next.voice;
  }else{
   const [owner,volume]=call.args,timer=timers[owner];timer[0x28]=volume;
   writes.push(...applyOriginalMt32DriverControl('volume',timer[0x47],emptyVoice,instrument,volume).writes);
  }
 });
 return {car,timers,voices,lastNotes,command,driver,writes};
}
