import {stepVoiceTick} from './voice-tick.ts';
import {stopOriginalTandyChannel} from './tandy-lifecycle.ts';
import {updateOriginalTandyVoice,type OriginalTandyBiosSound} from './tandy-voice-update.ts';
export interface OriginalTandyVoiceState {voices:Uint8Array[];timers:Uint8Array[];lastNotes:Uint8Array;driver:Uint8Array;cx:number}
/** Full2B272 voice iteration. CX is an explicit incoming/outgoing register;
 * the generic iterator itself does not overwrite it between TD15 callbacks. */
export function stepOriginalTandyVoiceTimer(before:OriginalTandyVoiceState,instrumentAt:(offset:number,segment:number)=>Uint8Array,driverSegment:number,port61:number){
 const voices=before.voices.map(v=>v.slice()),timers=before.timers.map(t=>t.slice()),lastNotes=before.lastNotes.slice(),driver=before.driver.slice(),writes:number[][]=[],calls:number[]=[],bios:OriginalTandyBiosSound[]=[];let cx=before.cx&65535;
 for(let index=0;index<voices.length;index++){
  const old=voices[index];if(!old[1])continue;const v=new DataView(old.buffer),instrument=instrumentAt(v.getUint16(16,true),v.getUint16(18,true)),owner=old[0],timer=timers[owner];
  if(!timer)throw Error('Missing Tandy voice owner');const tick=stepVoiceTick(old,instrument,timer[0x25],timer[0x15],lastNotes[owner]);voices[index]=tick.record;timer[0x15]=tick.ownerCount;lastNotes[owner]=tick.ownerNote;
  for(const offset of tick.calls){
   calls.push(offset);const record=voices[index],channel=record[44];if(offset===12)continue;
   if(offset===15){const stopped=stopOriginalTandyChannel(driver,driverSegment,channel,port61);writes.push(...stopped.writes);bios.push(...stopped.bios);if(channel>=1&&channel<=4)cx=(cx&0xff00)|15;for(const [port,value] of stopped.writes)if(port===0x61)port61=value;}
   else if(offset===39){const pointer=new DataView(record.buffer).getUint16(42,true),driverTimer=timers[(pointer-0x801e)/72];if(!driverTimer)throw Error('Missing retained Tandy timer');const updated=updateOriginalTandyVoice(driver,driverSegment,channel,record,driverTimer,instrument,cx,port61);cx=updated.cx;writes.push(...updated.writes);bios.push(...updated.bios);for(const [port,value] of updated.writes)if(port===0x61)port61=value;}
   else throw Error('Unreconstructed Tandy voice callback');
  }
 }
 calls.push(48);return {voices,timers,lastNotes,driver,cx,port61,writes,bios,calls};
}
