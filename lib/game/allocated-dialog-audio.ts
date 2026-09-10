import {originalMenuAudioControl} from './menu-audio-control.ts';
import {adlibVolume} from './adlib-volume.ts';
import {adlibUpdate} from './adlib-update.ts';
/** Original regular-driver pause/resume on the live allocated audio tables. */
export function controlAllocatedDialogAudio(memory:Uint8Array,d:number,driverSegment:number,operation:'pause-audio'|'resume-audio'){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(d+at,true);
 if(memory[d+0x4e06])throw Error('Allocated dialog audio requires regular AdLib mode');
 const before={paused:memory[d+0x4e02],guard:word(0x4e0c),musicEnabled:memory[d+0x4e03],soundEnabled:memory[d+0x4e05],alternate:0,alternateVolume:memory[d+0x4e0b],trackCount:memory[d+0x88e2],volumes:Array.from({length:24},(_,i)=>memory[d+0x8046+i*72]),pausedVolumes:Array.from(memory.slice(d+0x6f78,d+0x6f90)),soundVolumes:Array.from(memory.slice(d+0x6f90,d+0x6fa8))};
 const {state,effects}=originalMenuAudioControl(before,operation),writes:number[][]=[];
 const instrument=(at:number)=>{const pointer=v.getUint16(at+16,true)+v.getUint16(at+18,true)*16;return Array.from(memory.slice(pointer,pointer+100));};
 memory[d+0x4e02]=1;v.setUint16(d+0x4e0c,1,true);
 for(const effect of effects){
  if(effect.type==='volume'){
   memory[d+0x8046+effect.owner*72]=effect.value;
   for(let index=1;index<memory[d+0x9fe4];index++){
    const at=d+0xa036+index*46;if(memory[at]===effect.owner)writes.push(...adlibVolume(instrument(at),index-1,effect.value,memory[driverSegment*16+0x957+index-1]));
   }
  }else if(effect.type==='update-voice'){
   const at=d+0xa036+effect.index*46,channel=memory[at+44];
   if(memory[at+1]&&channel){const timer=d+v.getUint16(at+42,true),result=adlibUpdate(memory.slice(at,at+46),memory.slice(timer,timer+72),instrument(at),channel-1);memory.set(result.record,at);writes.push(...result.writes);}
  }else if(effect.type!=='flush')throw Error('Unexpected dialog audio operation');
 }
 memory.set(state.pausedVolumes,d+0x6f78);memory[d+0x4e02]=state.paused;v.setUint16(d+0x4e0c,state.guard,true);
 return writes;
}
