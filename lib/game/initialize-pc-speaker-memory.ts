import {initializeLoadedAudioDriver} from './initialize-loaded-audio-driver.ts';
import {initializeOriginalPcSpeaker} from './pc-speaker-control.ts';
import {resetOriginalPcSpeakerAudio} from './pc-speaker-audio-reset.ts';
import {readOriginalPcSpeakerRaceState,writeOriginalPcSpeakerRaceState} from './pc-speaker-race-audio-memory.ts';
/** Original29770 entry with the actual native PC15 initialize/reset callbacks.
 * The caller has loaded the supplied driver's retained data at driverSegment. */
export async function initializeOriginalPcSpeakerMemory(memory:Uint8Array,d:number,driverSegment:number,port61:number){
 const writes:number[][]=[];
 const emit=(next:number[][])=>{for(const [port,value] of next)if(port===0x61)port61=value;writes.push(...next);};
 const result=await initializeLoadedAudioDriver({memory:()=>memory,
  initializeDriver(){const driver=memory.slice(driverSegment*16,driverSegment*16+0x2df),next=initializeOriginalPcSpeaker(driver,port61);memory.set(driver,driverSegment*16);emit(next.writes);return next.channels;},
  resetAudio(){
   if(memory[d+0x4e06]||memory[d+0x9fe4]!==5)throw Error('PC15 reset requires the regular five-slot driver');
   const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);view.setUint16(d+0x4e0c,1,true);
   const next=resetOriginalPcSpeakerAudio({...readOriginalPcSpeakerRaceState(memory,d,driverSegment),paused:1},port61);
   writeOriginalPcSpeakerRaceState(memory,d,next);view.setUint16(d+0x4e0c,next.paused,true);emit(next.writes);
  },
  async loadPatch(){throw Error('PC15 unexpectedly requested an alternate driver patch');},installPatch(){throw Error('Unexpected PC15 patch installation');},freePatch(){throw Error('Unexpected PC15 patch release');},alternateCommand(){throw Error('Unexpected PC15 alternate command');},
 },d,{offset:0,segment:driverSegment});
 return {result,writes,port61};
}
