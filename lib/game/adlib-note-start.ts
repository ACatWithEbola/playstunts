import {adlibInstrument,adlibPitch} from './adlib.ts';
import {adlibNoteOn} from './adlib-note-on.ts';
import {adlibVolume} from './adlib-volume.ts';
import {adlibRelease,adlibSilence} from './adlib-release.ts';
import {startNote,type NoteStartInput} from './note-start.ts';

/** AD15.DRV init returns ten logical slots: slot zero plus nine OPL channels.
 * Masks are from the supplied game's loaded driver table at DS:4de0.
 */
export const ADLIB_CHANNEL_MASKS=[1,2,4,8,16,32,64,128,256,512] as const;
export interface AdlibNoteStartState {
 /** Loaded segment matters to the original note-255 register-write quirk. */
 driverSegment:number;
 velocities:number[];
}
const view=(b:Uint8Array)=>new DataView(b.buffer,b.byteOffset,b.byteLength);

/** Complete regular note start with synchronous melodic AD15.DRV operations.
 * Channel-zero sample playback remains separate. All eight supplied
 * engine/effect patches exclude slot zero.
 */
export function startAdlibNote(input:NoteStartInput,state:AdlibNoteStartState){
 if(input.alternate)throw Error('AdLib note adapter requires regular output mode');
 if(state.velocities.length!==9)throw Error('Missing AdLib velocity state');
 const velocities=state.velocities.slice(),writes:number[][]=[],instrument=Array.from(input.instrument);
 const result=startNote(input,(call,context)=>{
  const logical=call.args[0],channel=logical-1;
  if(!Number.isInteger(channel)||channel<0||channel>8)throw Error('Unreconstructed AdLib sample channel');
  const index=(call.args[1]-0xa036)/46,record=context.voices[index];
  if(!record)throw Error('Invalid original voice pointer');
  const rv=view(record);
  if(call.offset===12){writes.push(...adlibRelease(channel,rv.getUint16(6,true)));return;}
  if(call.offset===15){writes.push(...adlibSilence(channel));return;}
  if(call.offset===36){const pitch=adlibPitch(call.args[2]);rv.setUint16(4,pitch,true);rv.setUint16(6,pitch,true);return;}
  const timer=context.timers[(call.args[2]-0x801e)/72];
  if(!timer)throw Error('Invalid original timer pointer');
  if(call.offset===33){
   writes.push(...adlibInstrument(instrument,channel,timer));return;
  }
  if(call.offset!==9)throw Error('Unsupported note-start driver callback');
  const note=call.args[3]&255,velocity=call.args[4]&255,volume=timer[0x28];
  record[3]=note;
  if(note!==255){
   const on=adlibNoteOn(instrument,channel,note,volume,velocity);
   rv.setUint16(4,on.pitch,true);rv.setUint16(6,on.detuned,true);
   velocities[channel]=on.effectiveVelocity;writes.push(...on.writes);
  }else{
   // At 0x150-0x16e the sentinel skips assigning DX. The caller loaded DX
   // with the driver's segment before its far call, and 0x19c writes that
   // value, even though the voice's stored pitch remains unchanged.
   const pitch=state.driverSegment&65535,operator=[0,1,2,8,9,10,16,17,18][channel];
   const effectiveVelocity=instrument[0x15]?velocity:127;
   velocities[channel]=effectiveVelocity;
   writes.push([0x40+operator,63],[0x43+operator,63],[0xa0+channel,pitch&255],[0xb0+channel,32|(pitch>>>8)],...adlibVolume(instrument,channel,volume,effectiveVelocity));
  }
 });
 return {...result,writes,velocities};
}
