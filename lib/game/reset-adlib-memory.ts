import {resetAudio} from './audio-reset.ts';
import {readOriginalRaceAudioState,writeOriginalRaceAudioState} from './race-audio-memory.ts';
/** Original regular ten-voice AdLib reset in the live data segment.
 * Hardware sample playback is not active in this backend. */
export function resetOriginalAdlibMemory(memory:Uint8Array,d:number,driverSegment:number){
 if(memory[d+0x4e06]||memory[d+0x9fe4]!==10)throw Error('Audio reset requires the initialized ten-voice AdLib driver');
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 v.setUint16(d+0x4e0c,1,true);
 const reset=resetAudio({...readOriginalRaceAudioState(memory,d,driverSegment),paused:1});
 writeOriginalRaceAudioState(memory,d,reset);v.setUint16(d+0x4e0c,reset.paused,true);return reset.writes;
}
