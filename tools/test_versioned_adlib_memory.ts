import assert from 'node:assert/strict';
import {readOriginalRaceAudioState,writeOriginalRaceAudioState} from '../lib/game/race-audio-memory.ts';
for(const generation of [undefined,'ms-1990','ms-1991'] as const){
 const memory=Uint8Array.from({length:0x100000},(_,i)=>i&255),d=0x60000,driver=0x8000,v=new DataView(memory.buffer);v.setUint16(d+0x8016,0,true);v.setUint16(d+0x86de,1,true);
 const before=memory.slice(),state=readOriginalRaceAudioState(memory,d,driver,generation),offset=driver*16+(generation==='ms-1991'?0x974:0x957);
 assert.deepEqual(state.velocities,Array.from(memory.slice(offset,offset+9)));writeOriginalRaceAudioState(memory,d,state);assert.deepEqual(memory,before);
 state.velocities[8]^=255;writeOriginalRaceAudioState(memory,d,state);const expected=before.slice();expected[offset+8]^=255;assert.deepEqual(memory,expected);
 const saved=memory.slice();assert.throws(()=>writeOriginalRaceAudioState(memory,d,{...state,velocities:[]}));assert.deepEqual(memory,saved);
}
console.log('Versioned AdLib velocity offsets round-trip and mutate only owned bytes; legacy/default intact, invalid state rejects before writes');
