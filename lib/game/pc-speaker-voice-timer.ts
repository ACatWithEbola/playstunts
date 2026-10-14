import {stepVoiceTick} from './voice-tick.ts';
import {stopOriginalPcSpeakerTone} from './pc-speaker-control.ts';
import {stepOriginalPcSpeakerOutput,updateOriginalPcSpeakerVoice} from './pc-speaker-output.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
import {restoreOriginalPcSpeakerSampleTimer} from './pc-speaker-sample.ts';
export interface OriginalPcSpeakerVoiceState {physicsEngine?:PhysicsEngineVersion;effectEngine?:PhysicsEngineVersion;voices:Uint8Array[];timers:Uint8Array[];lastNotes:Uint8Array;driver:Uint8Array;}
/** Original game2B272 voice lifecycle joined to PC15 melodic callbacks and
 * the final single-speaker multiplexing tick. */
export function stepOriginalPcSpeakerVoiceTimer(before:OriginalPcSpeakerVoiceState,instrumentAt:(offset:number,segment:number)=>Uint8Array,port61:number){
 const voices=before.voices.map(v=>v.slice()),timers=before.timers.map(t=>t.slice()),lastNotes=before.lastNotes.slice(),driver=before.driver.slice(),calls:number[]=[];
 const writes:number[][]=[];
 let restoreVector:{offset:number;segment:number}|undefined;
 for(let index=0;index<voices.length;index++){
  const old=voices[index];if(!old[1])continue;const data=new DataView(old.buffer),instrument=instrumentAt(data.getUint16(16,true),data.getUint16(18,true)),owner=old[0],timer=timers[owner];
  if(!timer)throw Error('Missing PC speaker voice owner');const tick=stepVoiceTick(old,instrument,timer[0x25],timer[0x15],lastNotes[owner],before.effectEngine??before.physicsEngine);voices[index]=tick.record;timer[0x15]=tick.ownerCount;lastNotes[owner]=tick.ownerNote;
  for(const offset of tick.calls){calls.push(offset);const record=voices[index],channel=record[0x2c];if(offset===12)continue;
   if(offset===15){
    if(channel===0){const stopped=restoreOriginalPcSpeakerSampleTimer(driver,before.physicsEngine);writes.push(...stopped.writes);restoreVector=stopped.restoreVector;}
    else stopOriginalPcSpeakerTone(driver,channel);
   }
   else if(offset===39){const pointer=new DataView(record.buffer).getUint16(0x2a,true),driverTimer=timers[(pointer-0x801e)/72];if(!driverTimer)throw Error('Missing stored PC speaker timer');updateOriginalPcSpeakerVoice(driver,channel,record,driverTimer,instrument,before.physicsEngine);}
   else throw Error('Unreconstructed PC speaker timer callback');
  }
 }
 calls.push(48);writes.push(...stepOriginalPcSpeakerOutput(driver,port61,before.physicsEngine).writes);return {voices,timers,lastNotes,driver,writes,calls,...(restoreVector?{restoreVector}:{}),...(before.physicsEngine?{physicsEngine:before.physicsEngine}:{}),...(before.effectEngine?{effectEngine:before.effectEngine}:{})};
}
