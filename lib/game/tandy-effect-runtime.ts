import {stepEffectSequence} from './effect-player.ts';
import {stepOriginalTandyVoiceTimer} from './tandy-voice-timer.ts';
import {startOriginalTandyAllocatedNote} from './tandy-note-start.ts';
import {setOriginalTandyVolume} from './tandy-control.ts';
import {stopOriginalTandyTrack} from './tandy-track-control.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';

export interface OriginalTandyEffectState {
 timers:Uint8Array[];voices:Uint8Array[];lastNotes:Uint8Array;
 driver:Uint8Array;
}
const view=(b:Uint8Array)=>new DataView(b.buffer,b.byteOffset,b.byteLength);

/** Original regular effect callback with TD15 tone voices and port output. */
export function stepOriginalTandyEffects(before:OriginalTandyEffectState,resources:LoadedEffectResource[],port61:number,driverSegment:number,incomingCx:number,otherInstrumentAt?:(offset:number,segment:number)=>Uint8Array){
 const instrumentAt=(offset:number,segment:number)=>{
  const resource=resources.find(r=>r.instrumentOffset===offset&&r.instrumentSegment===segment);
  if(!resource){if(otherInstrumentAt)return otherInstrumentAt(offset,segment);throw Error('Missing original loaded instrument');}
  return resource.instrument;
 };
 if(before.voices.some(v=>v[1]&&v[0]<16))throw Error('Music-owned voice timing is not reconstructed');
 const tick=stepOriginalTandyVoiceTimer({...before,cx:incomingCx},instrumentAt,driverSegment,port61);
 let {voices,timers,lastNotes,driver}=tick;
 const writes=tick.writes.slice(),bios=tick.bios.slice();port61=tick.port61;
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
     setOriginalTandyVolume(driver,index,event.value);
    }
   }else if(event.kind==='note'){
    // Original 0x2a96a returns -1 for a null instrument pointer.
    if(v.getUint32(0x1e,true)===0)continue;
    const command=new Uint8Array(10);command[4]=event.note;command[5]=event.velocity??timer[0x22];view(command).setUint32(6,event.duration,true);
    const started=startOriginalTandyAllocatedNote({alternate:false,channelMasks:[1,2,4,8,16,32],owner,instrument:instrumentAt(v.getUint16(0x1e,true),v.getUint16(0x20,true)),timers,voices,lastNotes,command},driver,driverSegment,port61);
    ({timers,voices,lastNotes,driver}=started);writes.push(...started.writes);bios.push(...started.bios);for(const [port,value] of started.writes)if(port===0x61)port61=value;
   }else{
    const stopped=stopOriginalTandyTrack(driver,timers,voices,owner,driverSegment,port61);writes.push(...stopped.writes);bios.push(...stopped.bios);port61=stopped.port61;
   }
  }
  v=view(timers[owner]);v.setUint32(0x18,sequence.wait,true);
  if(sequence.offset===null)v.setUint32(0,0,true);
  else {v.setUint16(0,resource.sequenceOffset+sequence.offset,true);v.setUint16(2,segment,true);}
 }
 return {timers,voices,lastNotes,driver,writes,bios,port61};
}
