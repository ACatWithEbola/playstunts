import {resetAudio} from './audio-reset.ts';
import {readOriginalRaceAudioState,writeOriginalRaceAudioState} from './race-audio-memory.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
import {versionedAdlibRegisterWrites} from './versioned-adlib-register-writes.ts';
/** Original regular ten-voice AdLib reset in the live data segment.
 * Hardware sample playback is not active in this backend. */
export function resetOriginalAdlibMemory(memory:Uint8Array,d:number,driverSegment:number,driverGeneration?:PhysicsEngineVersion){
 if(memory[d+0x4e06]||memory[d+0x9fe4]!==10)throw Error('Audio reset requires the initialized ten-voice AdLib driver');
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 v.setUint16(d+0x4e0c,1,true);
 const reset=resetAudio({...readOriginalRaceAudioState(memory,d,driverSegment,driverGeneration),paused:1});
 writeOriginalRaceAudioState(memory,d,{...reset,driverGeneration});v.setUint16(d+0x4e0c,reset.paused,true);return versionedAdlibRegisterWrites(memory.subarray(driverSegment*16,driverSegment*16+0xa7d),reset.writes,driverGeneration);
}
