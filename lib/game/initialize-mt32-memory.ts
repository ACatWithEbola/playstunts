import {initializeLoadedAudioDriver,type LoadedAudioPointer} from './initialize-loaded-audio-driver.ts';
import {initializeOriginalMt32,uploadOriginalMt32Patches,sendOriginalMt32SystemExclusive} from './mt32-system-exclusive.ts';
import type {OriginalMt32MpuProgram} from './mt32-transport.ts';
import {resetOriginalMt32Audio} from './mt32-audio-reset.ts';
import {readOriginalMt32RaceState,writeOriginalMt32RaceState} from './mt32-race-audio-memory.ts';
import {writeOriginalMt32Mpu} from './mt32-transport.ts';
export interface OriginalMt32InitializationHost {
 execute(program:OriginalMt32MpuProgram):number|Promise<number>;
 loadPatch(name:number):Promise<LoadedAudioPointer>;
 freePatch(pointer:LoadedAudioPointer):void;
}
/** Original29770 orchestration with native MT15 initialization, reset and upload.
 * Caller supplies actual MPU timing and the game's patch allocation lifecycle. */
export async function initializeOriginalMt32Memory(memory:Uint8Array,d:number,driverSegment:number,host:OriginalMt32InitializationHost){
 const driver=()=>memory.subarray(driverSegment*16,driverSegment*16+1667);
 const read=(segment:number,offset:number)=>memory[(segment*16+offset)&0xfffff];
 return initializeLoadedAudioDriver({memory:()=>memory,
  initializeDriver(){return host.execute(initializeOriginalMt32(driver()));},
  async resetAudio(){
   if(memory[d+0x4e06]!==1||memory[d+0x9fe4]!==16)throw Error('MT15 reset requires alternate sixteen-slot mode');
   const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);view.setUint16(d+0x4e0c,1,true);
   const next=resetOriginalMt32Audio({...readOriginalMt32RaceState(memory,d,driverSegment),paused:1});
   writeOriginalMt32RaceState(memory,d,next);
   for(const [,value] of next.writes)await host.execute(writeOriginalMt32Mpu(driver(),value));
   view.setUint16(d+0x4e0c,next.paused,true);
  },
  loadPatch:host.loadPatch,
  async installPatch(pointer){await host.execute(uploadOriginalMt32Patches(driver(),read,pointer.segment,pointer.offset));},
  freePatch:host.freePatch,
  async alternateCommand(length,offset){await host.execute(sendOriginalMt32SystemExclusive(driver(),read,d>>>4,offset,length));},
 },d,{offset:0,segment:driverSegment});
}
