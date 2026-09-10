import {stepVoiceTick} from './voice-tick.ts';
import {applyOriginalMt32DriverControl} from './mt32-driver-control.ts';
export interface OriginalMt32VoiceState {voices:Uint8Array[];timers:Uint8Array[];lastNotes:Uint8Array}
/** Full2B272 iteration with the alternate MT15 callbacks. The original
 * common envelope code still decrements the retained owner count on decay,
 * even though alternate allocation did not increment it. */
export function stepOriginalMt32VoiceTimer(before:OriginalMt32VoiceState,instrumentAt:(offset:number,segment:number)=>Uint8Array){
 if(before.voices.length!==16)throw Error('MT15 requires16 logical voice records');
 const voices=before.voices.map(v=>v.slice()),timers=before.timers.map(t=>t.slice()),lastNotes=before.lastNotes.slice(),writes:number[][]=[],calls:number[]=[];
 for(let index=0;index<voices.length;index++){
  const old=voices[index];if(!old[1])continue;
  const view=new DataView(old.buffer),patch=instrumentAt(view.getUint16(16,true),view.getUint16(18,true)),owner=old[0],timer=timers[owner];
  if(!timer)throw Error('Missing MT15 voice owner');
  const tick=stepVoiceTick(old,patch,timer[0x25],timer[0x15],lastNotes[owner]);
  voices[index]=tick.record;timer[0x15]=tick.ownerCount;lastNotes[owner]=tick.ownerNote;
  for(const offset of tick.calls){
   calls.push(offset);
   const kind=offset===12?'release':offset===15?'noop':offset===39?'update':null;
   if(!kind)throw Error('Unreconstructed MT15 voice timer callback');
   writes.push(...applyOriginalMt32DriverControl(kind,voices[index][44],voices[index],patch).writes);
  }
 }
 calls.push(48);return {voices,timers,lastNotes,writes,calls};
}
