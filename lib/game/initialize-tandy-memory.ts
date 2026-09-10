import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
import {initializeLoadedAudioDriver} from './initialize-loaded-audio-driver.ts';
import {initializeOriginalTandy} from './tandy-lifecycle.ts';
import {resetOriginalTandyAudio} from './tandy-audio-reset.ts';
import {readOriginalTandyRaceState,writeOriginalTandyRaceState} from './tandy-race-audio-memory.ts';
/** Original29770 entry with the actual native TD15 initialize/reset callbacks.
 * The caller has loaded the supplied driver's retained data at driverSegment. */
export async function initializeOriginalTandyMemory(memory:Uint8Array,d:number,driverSegment:number,port61:number){
 const writes:number[][]=[],bios:OriginalTandyBiosSound[]=[];const vectorView=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const emit=(next:number[][])=>{for(const [port,value] of next)if(port===0x61)port61=value;writes.push(...next);};
 const result=await initializeLoadedAudioDriver({memory:()=>memory,
  initializeDriver(){const driver=memory.slice(driverSegment*16,driverSegment*16+2993),next=initializeOriginalTandy(driver,driverSegment,port61,{offset:vectorView.getUint16(0x54,true),segment:vectorView.getUint16(0x56,true)});memory.set(driver,driverSegment*16);vectorView.setUint16(0x54,next.installVector.offset,true);vectorView.setUint16(0x56,next.installVector.segment,true);emit(next.writes);bios.push(...next.bios);return next.channels;},
  resetAudio(){
   if(memory[d+0x4e06]||memory[d+0x9fe4]!==6)throw Error('TD15 reset requires the regular six-slot driver');
   const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);view.setUint16(d+0x4e0c,1,true);
   const next=resetOriginalTandyAudio({...readOriginalTandyRaceState(memory,d,driverSegment),paused:1},port61,driverSegment);
   writeOriginalTandyRaceState(memory,d,next);view.setUint16(d+0x4e0c,next.paused,true);emit(next.writes);bios.push(...next.bios);
  },
  async loadPatch(){throw Error('TD15 unexpectedly requested an alternate driver patch');},installPatch(){throw Error('Unexpected TD15 patch installation');},freePatch(){throw Error('Unexpected TD15 patch release');},alternateCommand(){throw Error('Unexpected TD15 alternate command');},
 },d,{offset:0,segment:driverSegment});
 return {result,writes,bios,port61};
}
