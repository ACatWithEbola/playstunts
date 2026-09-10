import {stepVoiceTick} from './voice-tick.ts';
import {adlibUpdate} from './adlib-update.ts';
import {adlibRelease,adlibSilence} from './adlib-release.ts';

export interface AdlibVoiceTimerState {voices:Uint8Array[];timers:Uint8Array[];lastNotes:Uint8Array}
/** Complete 0x2b272 loop plus melodic AD15 release/silence/update callbacks.
 * Instrument lookup uses the original far pointer retained in each voice.
 * Music-owner duration processing belongs to the separate music path.
 */
export function stepAdlibVoiceTimer(before:AdlibVoiceTimerState,instrumentAt:(offset:number,segment:number)=>Uint8Array){
 const voices=before.voices.map(v=>v.slice()),timers=before.timers.map(t=>t.slice()),lastNotes=before.lastNotes.slice();
 const writes:number[][]=[],calls:number[]=[];
 for(let index=0;index<voices.length;index++){
  const old=voices[index];
  if(!old[1])continue;
  if(old.length!==46)throw Error('Invalid original hardware voice');
  const data=new DataView(old.buffer),instrument=instrumentAt(data.getUint16(16,true),data.getUint16(18,true));
  const owner=old[0],timer=timers[owner];
  if(!timer||timer.length!==72)throw Error('Missing original voice owner');
  const tick=stepVoiceTick(old,instrument,timer[0x25],timer[0x15],lastNotes[owner]);
  voices[index]=tick.record;timer[0x15]=tick.ownerCount;lastNotes[owner]=tick.ownerNote;
  for(const offset of tick.calls){
   calls.push(offset);
   const record=voices[index],channel=record[0x2c]-1;
   if(channel<0||channel>8)throw Error('Unreconstructed AdLib sample-channel timer');
   if(offset===12)writes.push(...adlibRelease(channel,new DataView(record.buffer).getUint16(6,true)));
   else if(offset===15)writes.push(...adlibSilence(channel));
   else if(offset===39){
    // Driver receives the voice's stored timer pointer; owner bookkeeping
    // above uses the owner byte, as in the original enclosing loop.
    const pointer=new DataView(record.buffer).getUint16(0x2a,true),driverTimer=timers[(pointer-0x801e)/72];
    if(!driverTimer)throw Error('Missing stored driver timer pointer');
    const update=adlibUpdate(record,driverTimer,Array.from(instrument),channel);
    voices[index]=update.record;writes.push(...update.writes);
   }else throw Error('Unsupported original voice callback');
  }
 }
 // AD15.DRV entry 0x30 returns AX=ffff and performs no register writes.
 calls.push(48);
 return {voices,timers,lastNotes,writes,calls};
}
