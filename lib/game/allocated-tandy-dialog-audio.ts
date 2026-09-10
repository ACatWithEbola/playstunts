import {originalMenuAudioControl} from './menu-audio-control.ts';
import {setOriginalTandyVolume} from './tandy-control.ts';
import {updateOriginalTandyVoice,type OriginalTandyBiosSound} from './tandy-voice-update.ts';
/** Original regular-driver pause/resume on the live allocated audio tables.
 * The final volume call2A7D0 leaves CX=6 before the16 raw voice updates. */
export function controlAllocatedTandyDialogAudio(memory:Uint8Array,d:number,driverSegment:number,operation:'pause-audio'|'resume-audio',port61:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(d+at,true);
 if(memory[d+0x4e06]||memory[d+0x9fe4]!==6)throw Error('Allocated dialog audio requires regular TD15 mode');
 const driver=memory.slice(driverSegment*16,driverSegment*16+2993);
 const before={paused:memory[d+0x4e02],guard:word(0x4e0c),musicEnabled:memory[d+0x4e03],soundEnabled:memory[d+0x4e05],alternate:0,alternateVolume:memory[d+0x4e0b],trackCount:memory[d+0x88e2],volumes:Array.from({length:24},(_,i)=>memory[d+0x8046+i*72]),pausedVolumes:Array.from(memory.slice(d+0x6f78,d+0x6f90)),soundVolumes:Array.from(memory.slice(d+0x6f90,d+0x6fa8))};
 const {state,effects}=originalMenuAudioControl(before,operation),writes:number[][]=[],bios:OriginalTandyBiosSound[]=[];let cx=memory[d+0x9fe4];
 const instrument=(at:number)=>{const pointer=v.getUint16(at+16,true)+v.getUint16(at+18,true)*16;return memory.slice(pointer,pointer+100);};
 memory[d+0x4e02]=1;v.setUint16(d+0x4e0c,1,true);
 for(const effect of effects){
  if(effect.type==='volume'){
   memory[d+0x8046+effect.owner*72]=effect.value;
   for(let index=0;index<memory[d+0x9fe4];index++){
    const at=d+0xa036+index*46;if(memory[at]===effect.owner)setOriginalTandyVolume(driver,index,effect.value);
   }
  }else if(effect.type==='update-voice'){
   const at=d+0xa036+effect.index*46,channel=memory[at+44];
   if(memory[at+1]){const timer=d+v.getUint16(at+42,true),record=memory.slice(at,at+46);const updated=updateOriginalTandyVoice(driver,driverSegment,channel,record,memory.slice(timer,timer+72),instrument(at),cx,port61);cx=updated.cx;writes.push(...updated.writes);bios.push(...updated.bios);for(const [port,value] of updated.writes)if(port===0x61)port61=value;memory.set(record,at);}
  }else if(effect.type==='flush'){/* TD15:AE2 is a no-op. */}
  else throw Error('Unexpected dialog audio operation');
 }
 memory.set(state.pausedVolumes,d+0x6f78);memory[d+0x4e02]=state.paused;v.setUint16(d+0x4e0c,state.guard,true);
 memory.set(driver,driverSegment*16);return {writes,bios,cx};
}
