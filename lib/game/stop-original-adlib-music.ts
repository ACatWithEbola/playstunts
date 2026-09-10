import {stopOriginalMusic} from './stop-original-music.ts';
import {readOriginalRaceAudioState,writeOriginalRaceAudioState} from './race-audio-memory.ts';
import {adlibReset} from './adlib-release.ts';
import {stepAdlibVoiceTimer} from './adlib-voice-timer.ts';
/** Original 2918c with regular AdLib 2b4d8 stop and 2b272 flush callbacks. */
export function stopOriginalAdlibMusic(memory:Uint8Array,d:number,driverSegment:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),writes:number[][]=[];
 if(memory[d+0x4e06]||v.getUint16(d+0x4ddc,true)!==0||v.getUint16(d+0x4dde,true)!==driverSegment)throw Error('Original music shutdown requires the loaded regular AdLib driver');
 const count=memory[d+0x9fe4];if(count>10)throw Error('Original AdLib voice count exceeds the allocated table');
 stopOriginalMusic({memory:()=>memory,stopTracks(first,last){
  for(let index=0;index<count;index++){
   const at=d+0xa036+index*46,owner=memory[at];if(owner<first||owner>last)continue;
   writes.push(...(index===0?[[0xb0,1]]:adlibReset(index-1)));
   memory[at]=255;memory[at+1]=0;memory[at+2]=0;v.setUint32(at+16,0,true);
  }
  for(let owner=first;owner<=last;owner++)memory[d+0x801e+owner*72+0x15]=0;
 },flushVoices(){
  const state=readOriginalRaceAudioState(memory,d,driverSegment);
  const next=stepAdlibVoiceTimer({...state,voices:state.voices.slice(0,count)},(offset,segment)=>{
   const at=segment*16+offset;if(at+100>memory.length)throw Error('Original active music instrument is outside memory');return memory.slice(at,at+100);
  });
  writeOriginalRaceAudioState(memory,d,{...state,...next,voices:[...next.voices,...state.voices.slice(count)]});writes.push(...next.writes);
 }},d);
 return writes;
}
