import assert from 'node:assert/strict';
import {readOriginalMt32RaceState,writeOriginalMt32RaceState} from '../lib/game/mt32-race-audio-memory.ts';
for(const engine of [undefined,'ms-1990','ms-1991'] as const){
 const memory=Uint8Array.from({length:0x100000},(_,i)=>(i*17)&255),d=0x60000,driver=0x8000,v=new DataView(memory.buffer);v.setUint16(d+0x8016,0,true);v.setUint16(d+0x86de,1,true);
 const original=memory.slice(),state=readOriginalMt32RaceState(memory,d,driver,engine);
 assert.equal(state.driver.length,engine==='ms-1991'?1750:1667);assert.equal(state.physicsEngine,engine);
 writeOriginalMt32RaceState(memory,d,state);assert.deepEqual(memory,original);
 const invalid={...state,driver:state.driver.slice(0,-1)};assert.throws(()=>writeOriginalMt32RaceState(memory,d,invalid));assert.deepEqual(memory,original);
 state.driver[state.driver.length-1]^=255;writeOriginalMt32RaceState(memory,d,state);const expected=original.slice();expected[driver*16+state.driver.length-1]^=255;assert.deepEqual(memory,expected);
}
console.log('MT15 versioned retained state round-trips both driver sizes; invalid banks reject before writes and unrelated memory remains unchanged');
