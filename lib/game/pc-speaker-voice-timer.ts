import {stepVoiceTick} from './voice-tick.ts';
import {stopOriginalPcSpeakerTone} from './pc-speaker-control.ts';
import {stepOriginalPcSpeakerOutput,updateOriginalPcSpeakerVoice} from './pc-speaker-output.ts';
export interface OriginalPcSpeakerVoiceState {voices:Uint8Array[];timers:Uint8Array[];lastNotes:Uint8Array;driver:Uint8Array;}
/** Original game2B272 voice lifecycle joined to PC15 melodic callbacks and
 * the final single-speaker multiplexing tick. */
export function stepOriginalPcSpeakerVoiceTimer(before:OriginalPcSpeakerVoiceState,instrumentAt:(offset:number,segment:number)=>Uint8Array,port61:number){
 const voices=before.voices.map(v=>v.slice()),timers=before.timers.map(t=>t.slice()),lastNotes=before.lastNotes.slice(),driver=before.driver.slice(),calls:number[]=[];
 for(let index=0;index<voices.length;index++){
  const old=voices[index];if(!old[1])continue;const data=new DataView(old.buffer),instrument=instrumentAt(data.getUint16(16,true),data.getUint16(18,true)),owner=old[0],timer=timers[owner];
  if(!timer)throw Error('Missing PC speaker voice owner');const tick=stepVoiceTick(old,instrument,timer[0x25],timer[0x15],lastNotes[owner]);voices[index]=tick.record;timer[0x15]=tick.ownerCount;lastNotes[owner]=tick.ownerNote;
  for(const offset of tick.calls){calls.push(offset);const record=voices[index],channel=record[0x2c];if(offset===12)continue;
   if(offset===15)stopOriginalPcSpeakerTone(driver,channel);
   else if(offset===39){const pointer=new DataView(record.buffer).getUint16(0x2a,true),driverTimer=timers[(pointer-0x801e)/72];if(!driverTimer)throw Error('Missing stored PC speaker timer');updateOriginalPcSpeakerVoice(driver,channel,record,driverTimer,instrument);}
   else throw Error('Unreconstructed PC speaker timer callback');
  }
 }
 calls.push(48);const {writes}=stepOriginalPcSpeakerOutput(driver,port61);return {voices,timers,lastNotes,driver,writes,calls};
}
