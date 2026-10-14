import {stepVoiceTick} from './voice-tick.ts';
import {runOriginalTandyChannelStop} from './tandy-lifecycle.ts';
import {runOriginalTandyVoiceUpdate,type OriginalTandyBiosSound} from './tandy-voice-update.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
export interface OriginalTandyVoiceState {voices:Uint8Array[];timers:Uint8Array[];lastNotes:Uint8Array;driver:Uint8Array;cx:number;driverGeneration?:PhysicsEngineVersion;effectEngine?:PhysicsEngineVersion}
/** Full2B272 voice iteration. CX is an explicit incoming/outgoing register;
 * the generic iterator itself does not overwrite it between TD15 callbacks. */
export function stepOriginalTandyVoiceTimer(before:OriginalTandyVoiceState,instrumentAt:(offset:number,segment:number)=>Uint8Array,driverSegment:number,port61:number){
 const program=runOriginalTandyVoiceTimer(before,instrumentAt,driverSegment,port61);let step=program.next();while(!step.done)step=program.next();return step.value;
}
interface VoiceTimerResult extends OriginalTandyVoiceState {voices:Uint8Array<ArrayBuffer>[];timers:Uint8Array<ArrayBuffer>[];lastNotes:Uint8Array<ArrayBuffer>;driver:Uint8Array<ArrayBuffer>;port61:number;writes:number[][];bios:OriginalTandyBiosSound[];calls:number[]}
export function* runOriginalTandyVoiceTimer(before:OriginalTandyVoiceState,instrumentAt:(offset:number,segment:number)=>Uint8Array,driverSegment:number,port61:number,deferBios=false):Generator<{state:OriginalTandyVoiceState;port61:number;writes:number[][];bios:OriginalTandyBiosSound[]},VoiceTimerResult,{driver:Uint8Array;port61:number}|undefined>{
 const voices=before.voices.map(v=>v.slice()),timers=before.timers.map(t=>t.slice()),lastNotes=before.lastNotes.slice(),driver=before.driver.slice(),writes:number[][]=[],calls:number[]=[],bios:OriginalTandyBiosSound[]=[];let cx=before.cx&65535;
 for(let index=0;index<voices.length;index++){
  const old=voices[index];if(!old[1])continue;const v=new DataView(old.buffer),instrument=instrumentAt(v.getUint16(16,true),v.getUint16(18,true)),owner=old[0],timer=timers[owner];
  if(!timer)throw Error('Missing Tandy voice owner');const tick=stepVoiceTick(old,instrument,timer[0x25],timer[0x15],lastNotes[owner],before.effectEngine??before.driverGeneration);voices[index]=tick.record;timer[0x15]=tick.ownerCount;lastNotes[owner]=tick.ownerNote;
  for(const offset of tick.calls){
   calls.push(offset);const record=voices[index],channel=record[44];if(offset===12)continue;
   if(offset===15){
    const program=runOriginalTandyChannelStop(driver,driverSegment,channel,port61,before.driverGeneration,deferBios);let step=program.next(),emittedBios=0;
    try{while(!step.done){
     bios.push(...step.value.bios);emittedBios+=step.value.bios.length;
     const resumed=yield {state:{voices,timers,lastNotes,driver,cx,driverGeneration:before.driverGeneration,effectEngine:before.effectEngine},port61,writes:writes.map(write=>write.slice()),bios:bios.map(request=>({...request}))};
     if(resumed){if(!Number.isInteger(resumed.port61)||resumed.port61<0||resumed.port61>255)throw Error('Invalid resumed Tandy voice port');port61=resumed.port61;}
     step=program.next(resumed?.driver);
    }
    const stopped=step.value;writes.push(...stopped.writes);bios.push(...stopped.bios.slice(emittedBios));if(channel>=1&&channel<=4)cx=(cx&0xff00)|15;for(const [port,value] of stopped.writes)if(port===0x61)port61=value;
    }finally{program.return(undefined as never);}
   }
   else if(offset===39){
    const pointer=new DataView(record.buffer).getUint16(42,true),driverTimer=timers[(pointer-0x801e)/72];if(!driverTimer)throw Error('Missing retained Tandy timer');
    const program=runOriginalTandyVoiceUpdate(driver,driverSegment,channel,record,driverTimer,instrument,cx,port61,before.driverGeneration,deferBios);
    let step=program.next(),emittedWrites=0,emittedBios=0;
    try{
     while(!step.done){
      writes.push(...step.value.writes);bios.push(...step.value.bios);emittedWrites+=step.value.writes.length;emittedBios+=step.value.bios.length;
      const resumed=yield {state:{voices,timers,lastNotes,driver,cx,driverGeneration:before.driverGeneration,effectEngine:before.effectEngine},port61,writes:writes.map(write=>write.slice()),bios:bios.map(request=>({...request}))};
      if(resumed){if(!Number.isInteger(resumed.port61)||resumed.port61<0||resumed.port61>255)throw Error('Invalid resumed Tandy voice port');port61=resumed.port61;}
      step=program.next(resumed?.driver);
     }
     const updated=step.value;cx=updated.cx;writes.push(...updated.writes.slice(emittedWrites));bios.push(...updated.bios.slice(emittedBios));for(const [port,value] of updated.writes)if(port===0x61)port61=value;
    }finally{program.return(undefined as never);}
   }
   else throw Error('Unreconstructed Tandy voice callback');
  }
 }
 calls.push(48);return {voices,timers,lastNotes,driver,cx,port61,writes,bios,calls,...(before.driverGeneration===undefined?{}:{driverGeneration:before.driverGeneration}),...(before.effectEngine?{effectEngine:before.effectEngine}:{})};
}
