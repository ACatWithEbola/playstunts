import {createOriginalPcSpeakerRaceAudio} from './pc-speaker-race-audio.ts';
import {readOriginalPcSpeakerRaceState,writeOriginalPcSpeakerRaceState} from './pc-speaker-race-audio-memory.ts';
import {readOriginalCarSoundResources} from './read-car-sound-resources.ts';
import {stepOriginalPcSpeakerEffects} from './pc-speaker-effect-runtime.ts';
import {stepOriginalPcSpeakerCarRecords} from './pc-speaker-engine-interrupt.ts';
import {produceRaceAudioInPlace,type RaceAudioRequest} from './produce-race-audio.ts';
import {stopOriginalPcSpeakerEffect} from './pc-speaker-effect-stop.ts';
import type {Vector} from '../physics/math.ts';
/** One allocated race's regular PC15 resources and live memory state.
 * Construct after allocation and music shutdown; discard before freeing banks. */
export function createAllocatedPcSpeakerRaceAudio(memory:()=>Uint8Array,d:number,driverSegment:number,speakerPort:()=>number){
 const view=()=>{const m=memory();return new DataView(m.buffer,m.byteOffset,m.byteLength);};
 const word=(at:number)=>view().getUint16(d+at,true),byte=(at:number)=>memory()[d+at];
 if(byte(0x4e06))throw Error('Allocated race audio requires the regular PC15 driver');
 const handles=[word(0x8016)];if(byte(0x8fc8))handles.push(word(0x86de));
 const resources=readOriginalCarSoundResources(memory(),d,handles);
 const state=()=>readOriginalPcSpeakerRaceState(memory(),d,driverSegment);
 const operate=<T>(operation:(race:ReturnType<typeof createOriginalPcSpeakerRaceAudio>)=>T)=>{
  const race=createOriginalPcSpeakerRaceAudio(state(),resources,speakerPort(),byte(0x4e05)!==0,byte(0x9f5a));
  const result=operation(race);writeOriginalPcSpeakerRaceState(memory(),d,{...race.snapshot(),driverSegment});return result;
 };
 const dispatch=(requests:readonly RaceAudioRequest[])=>{
  const writes=operate(race=>race.dispatchRequests(requests,race.snapshot().soundFlags));
  if(requests.some(request=>request.kind==='reset'))view().setUint16(d+0x4e0c,0,true);
  return writes;
 };
 return {
  start(handle:number){return operate(race=>race.start(handle));},
  impacts(handle:number,flags:number,active:boolean){return operate(race=>race.impacts(handle,flags,active));},
  crash(handle:number){return operate(race=>race.crash(handle));},
  update(handle:number,rpm:number,previous:Vector,current:Vector,interval:number){operate(race=>race.update(handle,rpm,previous,current,interval));},
  dispatchRequests:dispatch,
  produce(){return dispatch(produceRaceAudioInPlace(memory(),d).requests);},
  stopEffect(handle:number){
   // Original292F8 releases ownership before stopping the driver's voice.
   // Calling29466 alone leaves a timer busy across a race resource reload.
   if((handle<<16>>16)>=0)memory()[d+((0xa3aa+handle)&65535)]=0;
   const before=state(),next=stopOriginalPcSpeakerEffect(before,handle,byte(0x9f5a));writeOriginalPcSpeakerRaceState(memory(),d,{...before,...next});return next.writes;
  },
  /** Original independently gated 2a1f0 and 193cd registrations. */
  tick(stackMatches=true){
   let next=state();const writes:number[][]=[];
   if((word(0x4ddc)||word(0x4dde))&&!word(0x4e0c)&&!word(0x4e6a)){
    if(byte(0x4e04)===1&&byte(0x4e03)===1&&byte(0x4e02)===0)throw Error('Menu music must be stopped before race audio ticks');
    view().setUint16(d+0x4e6a,1,true);
    const audio=stepOriginalPcSpeakerEffects(next,resources,speakerPort());next={...next,...audio};writes.push(...audio.writes);
    view().setUint16(d+0x4e6a,word(0x4e6a)-1,true);
   }
   const cars=stepOriginalPcSpeakerCarRecords({...next,car:next.cars[0]},resources,byte(0x4e05)!==0,byte(0x9f5a),stackMatches);
   writeOriginalPcSpeakerRaceState(memory(),d,{...next,...cars});writes.push(...cars.writes);return writes;
  },
 };
}
