import {originalMenuAudioControl} from './menu-audio-control.ts';
import {sendOriginalMt32SystemExclusive} from './mt32-system-exclusive.ts';
import type {OriginalMt32MpuProgram} from './mt32-transport.ts';
/** Original alternate-driver dialog pause/resume with live system-volume bytes.
 * Host advances MPU operations explicitly, retaining the original port-read delays. */
export function* controlAllocatedMt32DialogAudio(memory:Uint8Array,d:number,driverSegment:number,operation:'pause-audio'|'resume-audio'):OriginalMt32MpuProgram{
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(d+at,true);
 if(memory[d+0x4e06]!==1||memory[d+0x9fe4]!==16)throw Error('Allocated dialog audio requires alternate MT15 mode');
 const driver=memory.subarray(driverSegment*16,driverSegment*16+1667);
 const before={paused:memory[d+0x4e02],guard:word(0x4e0c),musicEnabled:memory[d+0x4e03],soundEnabled:memory[d+0x4e05],alternate:1,alternateVolume:memory[d+0x4e0b],trackCount:memory[d+0x88e2],volumes:Array.from({length:24},(_,i)=>memory[d+0x8046+i*72]),pausedVolumes:Array.from(memory.slice(d+0x6f78,d+0x6f90)),soundVolumes:Array.from(memory.slice(d+0x6f90,d+0x6fa8))};
 const {state,effects}=originalMenuAudioControl(before,operation);
 memory[d+0x4e02]=1;v.setUint16(d+0x4e0c,1,true);
 for(const effect of effects){
  if(effect.type!=='master-volume')throw Error('Unexpected Roland dialog audio operation');
  memory[d+0x4e0b]=effect.value;
  yield* sendOriginalMt32SystemExclusive(driver,(segment,offset)=>memory[((segment*16)+offset)&0xfffff],d>>>4,0x4e08,4);
 }
 memory[d+0x4e02]=state.paused;v.setUint16(d+0x4e0c,state.guard,true);
 return 0;
}
