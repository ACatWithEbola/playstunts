import {stopOriginalTandyChannel} from './tandy-lifecycle.ts';
import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
import {controlOriginalTandyChannel} from './tandy-control.ts';
/** Original2A66E retains sustain in the game and forwards each owned voice's
 * controller to TD15, including inactive records. TD15 handles controller7. */
export function applyOriginalTandyTrackControl(driver:Uint8Array,timers:Uint8Array[],voices:Uint8Array[],owner:number,control:number,value:number){
 const timer=timers[owner];control&=255;value&=65535;if(control===64)timer[0x25]=value&255;
 for(let i=0;i<voices.length;i++){const voice=voices[i];if(voice[0]!==timer[0x23])continue;controlOriginalTandyChannel(driver,i,control,value);if(control===64&&!value&&voice[1]===2)voice[22]=4;}
}

/** Original2B4D8 stops every owned record, including inactive sample/PC slots. */
export function stopOriginalTandyTrack(driver:Uint8Array,timers:Uint8Array[],voices:Uint8Array[],owner:number,driverSegment:number,port61:number,lastOwner=owner){
 const writes:number[][]=[],bios:OriginalTandyBiosSound[]=[];
 for(let i=0;i<voices.length;i++){
  const voice=voices[i];if(voice[0]<owner||voice[0]>lastOwner)continue;
  const stopped=stopOriginalTandyChannel(driver,driverSegment,i,port61);writes.push(...stopped.writes);bios.push(...stopped.bios);for(const [port,value] of stopped.writes)if(port===0x61)port61=value;
  voice[0]=255;voice[1]=voice[2]=0;new DataView(voice.buffer,voice.byteOffset,voice.byteLength).setUint32(16,0,true);
 }
 for(let i=owner;i<=lastOwner;i++)timers[i][0x15]=0;return {writes,bios,port61};
}
