import assert from 'node:assert/strict';
import {readOriginalPcSpeakerRaceState,writeOriginalPcSpeakerRaceState} from '../lib/game/pc-speaker-race-audio-memory.ts';
for(const engine of [undefined,'ms-1990','ms-1991'] as const){
 const memory=Uint8Array.from({length:0x100000},(_,i)=>(i*31+17)&255),d=0x60000,driver=0x8000,v=new DataView(memory.buffer);
 v.setUint16(d+0x8016,0,true);v.setUint16(d+0x86de,1,true);
 const before=memory.slice(),state=readOriginalPcSpeakerRaceState(memory,d,driver,engine),modern=engine==='ms-1991';
 assert.equal(state.voices.length,modern?7:5);assert.equal(state.driver.length,modern?0x2e9:0x2df);
 writeOriginalPcSpeakerRaceState(memory,d,state);assert.deepEqual(memory,before,'Read/write must retain every unrelated byte');
 state.voices.at(-1)![45]^=255;state.driver[state.driver.length-1]^=255;
 writeOriginalPcSpeakerRaceState(memory,d,state);
 const expected=before.slice();expected[d+0xa036+(state.voices.length-1)*46+45]^=255;expected[driver*16+state.driver.length-1]^=255;assert.deepEqual(memory,expected);
 const bad={...state,voices:state.voices.slice(0,-1)};const saved=memory.slice();assert.throws(()=>writeOriginalPcSpeakerRaceState(memory,d,bad));assert.deepEqual(memory,saved,'Invalid state rejects before writes');
}
console.log('Versioned PC15 codec round-trips5/7 slots, preserves all unrelated memory, rejects partial banks before writes');
