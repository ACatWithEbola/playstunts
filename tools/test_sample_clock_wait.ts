import assert from 'node:assert/strict';
import {createPc15SampleClock} from '../lib/game/pc15-sample-clock.ts';
for(const rate of [44100,48000])for(const divisor of [0,149,11932]){
 const regular=createPc15SampleClock(rate,divisor),waiting=createPc15SampleClock(rate,divisor);
 const left:number[]=[],right:number[]=[];
 regular.advance(5120,offset=>{left.push(offset);if(left.length===3)regular.reload(1000);});
 await waiting.advanceWithWait(5120,async offset=>{
  right.push(offset);const phase=waiting.phase;
  await Promise.resolve();assert.equal(waiting.phase,phase);
  assert.throws(()=>waiting.advance(1,()=>{}),/overlaps/);
  await assert.rejects(waiting.advanceWithWait(1,async()=>{}),/overlaps/);
  if(right.length===3)waiting.reload(1000);
 });
 assert.deepEqual(right,left);assert.equal(waiting.phase,regular.phase);assert.equal(waiting.divisor,regular.divisor);
 await assert.rejects(waiting.advanceWithWait(100000,async()=>{throw Error('IRQ owner failed');}),/IRQ owner failed/);
 assert.doesNotThrow(()=>waiting.advance(1,()=>{}));
}
console.log('Waitable PIT clock matches synchronous IRQ positions, reloads and phase at both audio rates; waits preserve phase, overlap rejects and failure releases ownership');
