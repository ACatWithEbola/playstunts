import assert from 'node:assert/strict';
import {createMt32ExecutionClock} from '../lib/game/mt32-execution-clock.ts';
import {PC_PIT_INPUT_HZ} from '../lib/game/timer-interrupt.ts';
for(const cpuHz of [4772728,8000000,16000000]){
 const clock=createMt32ExecutionClock({cpuHz,pollCycles:11});
 clock.delay('decrement-dx',65536);
 assert.equal(clock.now(),Math.floor(1179636*PC_PIT_INPUT_HZ/cpuHz));
 for(let i=0;i<1000;i++)await clock.poll();
 assert.equal(clock.now(),Math.floor((1179636+11000)*PC_PIT_INPUT_HZ/cpuHz));
 const previous=clock.now();clock.advanceTo(previous);clock.advanceTo(previous-1);
 await clock.poll();
 assert.equal(clock.now(),Math.floor((1179636+11011)*PC_PIT_INPUT_HZ/cpuHz),'Synthesis catch-up retains fractional CPU phase');
 clock.advanceTo(previous+100000);assert.equal(clock.now(),previous+100000);
 const retained=clock.now();
 for(const count of [0,-1,65537,NaN,0.5])assert.throws(()=>clock.delay('decrement-dx',count),/CPU delay/);
 assert.equal(clock.now(),retained,'Rejected delay never advances time');
}
for(const value of [0,-1,NaN,Infinity,0.5]){
 assert.throws(()=>createMt32ExecutionClock({cpuHz:value,pollCycles:1}),/profile/);
 assert.throws(()=>createMt32ExecutionClock({cpuHz:1,pollCycles:value}),/profile/);
}
const overflow=createMt32ExecutionClock({cpuHz:1,pollCycles:Number.MAX_SAFE_INTEGER});
await assert.rejects(overflow.poll(),/overflow/);assert.equal(overflow.now(),0);
console.log('Explicit nominal 8086 Roland clock preserves fractional PIT phase and delay counts; no default CPU speed or browser timing claim');
