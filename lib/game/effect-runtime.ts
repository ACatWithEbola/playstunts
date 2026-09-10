import {stepEffectSequence} from './effect-player.ts';
import {stepAdlibVoiceTimer} from './adlib-voice-timer.ts';
import {startAdlibNote,ADLIB_CHANNEL_MASKS} from './adlib-note-start.ts';
import {adlibVolume} from './adlib-volume.ts';
import {adlibReset} from './adlib-release.ts';

export interface LoadedEffectResource {
 headerOffset:number;headerSegment:number;header:Uint8Array;
 instrumentOffset:number;instrumentSegment:number;instrument:Uint8Array;
 sequenceOffset:number;sequenceSegment:number;sequence:Uint8Array;
}
export interface EffectRuntimeState {
 timers:Uint8Array[];voices:Uint8Array[];lastNotes:Uint8Array;
 velocities:number[];driverSegment:number;
}
const view=(b:Uint8Array)=>new DataView(b.buffer,b.byteOffset,b.byteLength);

/** Running regular AdLib effect callback: hardware voices first, then effect
 * timers 16..22. Driver/pause/reentry gates are handled by audioTimerEvents.
 * Music sequencing and sample-channel playback remain separate work.
 */
export function stepEffectRuntime(before:EffectRuntimeState,resources:LoadedEffectResource[]){
 const instrumentAt=(offset:number,segment:number)=>{
  const resource=resources.find(r=>r.instrumentOffset===offset&&r.instrumentSegment===segment);
  if(!resource)throw Error('Missing original loaded instrument');
  return resource.instrument;
 };
 if(before.voices.some(v=>v[1]&&v[0]<16))throw Error('Music-owned voice timing is not reconstructed');
 const tick=stepAdlibVoiceTimer(before,instrumentAt);
 let {voices,timers,lastNotes}=tick;let velocities=before.velocities.slice();
 const writes=tick.writes.slice();
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
     if(index===0)continue; // AD15's channel-zero volume callback is a no-op.
     const rv=view(record),instrument=instrumentAt(rv.getUint16(16,true),rv.getUint16(18,true));
     writes.push(...adlibVolume(Array.from(instrument),index-1,event.value,velocities[index-1]));
    }
   }else if(event.kind==='note'){
    // Original 0x2a96a returns -1 for a null instrument pointer. SKI2
    // has this pointer in the supplied loaded AdLib resources.
    if(v.getUint32(0x1e,true)===0)continue;
    const command=new Uint8Array(10);command[4]=event.note;command[5]=event.velocity??timer[0x22];view(command).setUint32(6,event.duration,true);
    const started=startAdlibNote({alternate:false,channelMasks:Array.from(ADLIB_CHANNEL_MASKS),owner,instrument:instrumentAt(v.getUint16(0x1e,true),v.getUint16(0x20,true)),timers,voices,lastNotes,command},{driverSegment:before.driverSegment,velocities});
    ({timers,voices,lastNotes,velocities}=started);writes.push(...started.writes);
   }else{
    // 0x2b4d8 resets every matching record, including inactive ones, clears
    // instrument identity, and clears the owner count without changing lastNote.
    for(let index=0;index<voices.length;index++){
     const record=voices[index];if(record[0]!==owner)continue;
     if(index===0)throw Error('Unreconstructed sample-channel effect termination');
     writes.push(...adlibReset(index-1));record[0]=255;record[1]=0;record[2]=0;view(record).setUint32(16,0,true);
    }
    timers[owner][0x15]=0;
   }
  }
  v=view(timers[owner]);v.setUint32(0x18,sequence.wait,true);
  if(sequence.offset===null)v.setUint32(0,0,true);
  else {v.setUint16(0,resource.sequenceOffset+sequence.offset,true);v.setUint16(2,segment,true);}
 }
 return {timers,voices,lastNotes,velocities,driverSegment:before.driverSegment,writes};
}
