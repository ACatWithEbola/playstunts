import {stepEffectSequence} from './effect-player.ts';
import {runOriginalTandyVoiceTimer} from './tandy-voice-timer.ts';
import {startOriginalTandyAllocatedNote,runOriginalTandyAllocatedNote} from './tandy-note-start.ts';
import {setOriginalTandyVolume,originalTandyVolumeGateWrites} from './tandy-control.ts';
import {runOriginalTandyTrackStop} from './tandy-track-control.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';

import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
export interface OriginalTandyEffectState {
 timers:Uint8Array[];voices:Uint8Array[];lastNotes:Uint8Array;
 driver:Uint8Array;driverGeneration?:PhysicsEngineVersion;
 effectEngine?:PhysicsEngineVersion;
}
const view=(b:Uint8Array)=>new DataView(b.buffer,b.byteOffset,b.byteLength);

/** Original regular effect callback with TD15 tone voices and port output. */
export function* runOriginalTandyEffects(before:OriginalTandyEffectState,resources:LoadedEffectResource[],port61:number,driverSegment:number,incomingCx:number,otherInstrumentAt?:(offset:number,segment:number)=>Uint8Array,sampleDelivery:'reject'|'deferred'='reject',sampleAt?:(offset:number,segment:number)=>{offset:number;segment:number;length:number},deferLegacyBios=false){
 const instrumentAt=(offset:number,segment:number)=>{
  const resource=resources.find(r=>r.instrumentOffset===offset&&r.instrumentSegment===segment);
  if(!resource){if(otherInstrumentAt)return otherInstrumentAt(offset,segment);throw Error('Missing original loaded instrument');}
  return resource.instrument;
 };
 if(before.voices.some(v=>v[1]&&v[0]<16))throw Error('Music-owned voice timing is not reconstructed');
 const voiceProgram=runOriginalTandyVoiceTimer({...before,cx:incomingCx},instrumentAt,driverSegment,port61,deferLegacyBios);
 let voiceStep=voiceProgram.next();
 try{
  while(!voiceStep.done){
   const resumed:{driver:Uint8Array;port61:number}|undefined=yield {...voiceStep.value,sampleStarts:[]};
   voiceStep=voiceProgram.next(resumed);
  }
 }finally{voiceProgram.return(undefined as never);}
 const tick=voiceStep.value;
 let {voices,timers,lastNotes,driver}=tick;
 const writes=tick.writes.slice(),bios=tick.bios.slice();port61=tick.port61;
 const sampleStarts:ReturnType<typeof startOriginalTandyAllocatedNote>['sampleStarts']=[];
 for(let owner=16;owner<23;owner++){
  let timer=timers[owner],v=view(timer);const wait=v.getUint32(0x18,true);
  if(wait){v.setUint32(0x18,(wait-1)>>>0,true);continue;}
  const offset=v.getUint16(0,true),segment=v.getUint16(2,true);
  if((offset|segment)===0)continue;
  const resource=resources.find(r=>r.sequenceSegment===segment&&offset>=r.sequenceOffset&&offset<r.sequenceOffset+r.sequence.length);
  if(!resource)throw Error('Missing original effect sequence');
  const sequence=stepEffectSequence({offset:offset-resource.sequenceOffset,wait:0},resource.sequence);
  for(const event of sequence.events){
   timer=timers[owner];v=view(timer);
   if(event.kind==='instrument'){
    // The original table is located through timer+2e, not through a guessed
    // effect name. Each supported loaded effect contains its own pointer table.
    const tableOffset=v.getUint16(0x2e,true),tableSegment=v.getUint16(0x30,true);
    const table=resources.find(r=>r.headerSegment===tableSegment&&r.headerOffset+7===tableOffset);
    if(!table||event.value>=table.header[6])throw Error('Missing original effect instrument table entry');
    const h=view(table.header),entry=7+4*event.value;
    v.setUint16(0x1e,h.getUint16(entry,true),true);v.setUint16(0x20,h.getUint16(entry+2,true),true);
   }else if(event.kind==='volume'){
    timer[0x28]=event.value;
    for(let index=0;index<voices.length;index++){
     const record=voices[index];if(record[0]!==owner)continue;
     setOriginalTandyVolume(driver,index,event.value,before.driverGeneration);
     const gated=originalTandyVolumeGateWrites(index,event.value,port61,before.driverGeneration);writes.push(...gated);for(const [port,value] of gated)if(port===0x61)port61=value;
    }
   }else if(event.kind==='note'){
    // Original 0x2a96a returns -1 for a null instrument pointer.
    if(v.getUint32(0x1e,true)===0)continue;
    const command=new Uint8Array(10);command[4]=event.note;command[5]=event.velocity??timer[0x22];view(command).setUint32(6,event.duration,true);
    const previousLastNotes=lastNotes.slice();
    const noteProgram=runOriginalTandyAllocatedNote({alternate:false,channelMasks:[1,2,4,8,16,32],owner,instrument:instrumentAt(v.getUint16(0x1e,true),v.getUint16(0x20,true)),timers,voices,lastNotes,command},driver,driverSegment,port61,sampleAt,before.driverGeneration,sampleDelivery,deferLegacyBios);
    let noteStep=noteProgram.next(),emittedNoteWrites=0,emittedNoteBios=0;
    try{while(!noteStep.done){
     writes.push(...noteStep.value.writes.slice(emittedNoteWrites));bios.push(...noteStep.value.bios.slice(emittedNoteBios));emittedNoteWrites=noteStep.value.writes.length;emittedNoteBios=noteStep.value.bios.length;
     const resumed:{driver:Uint8Array;port61:number}|undefined=yield {...noteStep.value,writes:writes.map(write=>write.slice()),bios:bios.map(request=>({...request}))};
     noteStep=noteProgram.next(resumed);
    }}finally{noteProgram.return(undefined as never);}
    const started=noteStep.value;
    sampleStarts.push(...started.sampleStarts);
    ({timers,voices,lastNotes,driver}=started);writes.push(...started.writes.slice(emittedNoteWrites));bios.push(...started.bios.slice(emittedNoteBios));for(const [port,value] of started.writes)if(port===0x61)port61=value;
    if(started.sampleStarts.length){
     // Full CPU host commits this boundary, services requests, then resumes
     // with driver/port state changed by its delivered sample interrupts.
     const resumed:{driver:Uint8Array;port61:number}|undefined=yield {sampleStarts:started.sampleStarts.map(request=>({...request})),
      // Generic note start records lastNotes only after driver callback9
      // returns; do not publish that trailing update while playback waits.
      state:{timers,voices,lastNotes:previousLastNotes,driver,driverGeneration:before.driverGeneration},writes:writes.map(write=>write.slice()),bios:bios.map(request=>({...request})),port61};
     if(resumed){if(resumed.driver.length!==driver.length||!Number.isInteger(resumed.port61)||resumed.port61<0||resumed.port61>255)throw Error('Invalid resumed Tandy effect host state');driver=resumed.driver.slice();port61=resumed.port61;}
    }
   }else{
    const program=runOriginalTandyTrackStop(driver,timers,voices,owner,driverSegment,port61,owner,before.driverGeneration,deferLegacyBios);let step=program.next(),emittedWrites=0,emittedBios=0;
    try{while(!step.done){
     writes.push(...step.value.writes.slice(emittedWrites));bios.push(...step.value.bios.slice(emittedBios));emittedWrites=step.value.writes.length;emittedBios=step.value.bios.length;
     const resumed:{driver:Uint8Array;port61:number}|undefined=yield {state:{timers,voices,lastNotes,driver,driverGeneration:before.driverGeneration},sampleStarts:[],writes:writes.map(write=>write.slice()),bios:bios.map(request=>({...request})),port61:step.value.port61};
     step=program.next(resumed);
    }
    const stopped=step.value;writes.push(...stopped.writes.slice(emittedWrites));bios.push(...stopped.bios.slice(emittedBios));port61=stopped.port61;
    }finally{program.return(undefined as never);}
   }
  }
  v=view(timers[owner]);v.setUint32(0x18,sequence.wait,true);
  if(sequence.offset===null)v.setUint32(0,0,true);
  else {v.setUint16(0,resource.sequenceOffset+sequence.offset,true);v.setUint16(2,segment,true);}
 }
 return {timers,voices,lastNotes,driver,writes,bios,sampleStarts,port61,...(before.driverGeneration===undefined?{}:{driverGeneration:before.driverGeneration}),...(before.effectEngine?{effectEngine:before.effectEngine}:{})};
}
/** Synchronous tone/deferred adapter retained for existing callers. */
export function stepOriginalTandyEffects(...args:Parameters<typeof runOriginalTandyEffects>){
 const program=runOriginalTandyEffects(...args);let step=program.next();while(!step.done)step=program.next();return step.value;
}
