import assert from 'node:assert/strict';
import {readOriginalTandyRaceState,writeOriginalTandyRaceState} from '../lib/game/tandy-race-audio-memory.ts';
import {tandyDriverLayout} from '../lib/game/tandy-driver-layout.ts';
const d=0x10000,segment=0x5000,base=segment*16;
for(const generation of [undefined,'ms-1990','ms-1991'] as const){
 const memory=new Uint8Array(0x100000);for(let i=0;i<memory.length;i++)memory[i]=(i*13+7)&255;
 const original=memory.slice(),layout=tandyDriverLayout(generation),state=readOriginalTandyRaceState(memory,d,segment,generation);
 assert.equal(state.driver.length,layout.bytes);assert.equal(state.driverGeneration,generation);
 writeOriginalTandyRaceState(memory,d,state);assert.deepEqual(memory,original,'exact round-trip including unrelated memory');
 const end=layout.bytes-1;state.driver[end]^=255;writeOriginalTandyRaceState(memory,d,state);
 const expected=original.slice();expected[base+end]^=255;assert.deepEqual(memory,expected,'last byte retained, outside-driver untouched');
 const unchanged=memory.slice(),bad={...state,driver:state.driver.slice(0,-1)};
 assert.throws(()=>writeOriginalTandyRaceState(memory,d,bad));assert.deepEqual(memory,unchanged,'invalid size rejects before writes');
 if(generation==='ms-1991'){
  assert.throws(()=>writeOriginalTandyRaceState(memory,d,{...state,driverGeneration:'ms-1990'}));assert.deepEqual(memory,unchanged);
 }
 state.driver.fill(0);assert.notEqual(memory[base],0,'read snapshot owns its driver copy');
}
console.log('Versioned Tandy state: full2993/3241-byte retention,default legacy shape,ownership,exact round-trip and generation/length rejection without unrelated mutations');
