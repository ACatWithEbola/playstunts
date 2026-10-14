import assert from 'node:assert/strict';
import {createPc15SampleClock} from '../lib/game/pc15-sample-clock.ts';
import {PC_PIT_INPUT_HZ,ORIGINAL_PIT_DIVISOR} from '../lib/game/timer-interrupt.ts';
for(const rate of [8000,44100,48000])for(const divisor of [70,ORIGINAL_PIT_DIVISOR,0]){
 const whole=createPc15SampleClock(rate,divisor),split=createPc15SampleClock(rate,divisor);let a=0,b=0;
 whole.advance(rate,()=>a++);
 for(let n=0;n<rate;){const count=Math.min(137,rate-n);split.advance(count,()=>b++);n+=count;}
 assert.equal(a,Math.floor(PC_PIT_INPUT_HZ/(divisor||65536)));assert.equal(b,a);assert.equal(split.phase,whole.phase);
}
const clock=createPc15SampleClock(44100,70);let samples=0,tones=0;
clock.advance(44100,()=>{if(clock.divisor===70){samples++;clock.reload(ORIGINAL_PIT_DIVISOR);}else tones++;});
assert.equal(samples,1);assert.ok(tones>=99&&tones<=100);
assert.equal(clock.phase,((PC_PIT_INPUT_HZ-70)%ORIGINAL_PIT_DIVISOR)*44100,'Timer restoration retains sub-sample elapsed time');
assert.throws(()=>clock.reload(-1));assert.throws(()=>clock.advance(-1,()=>{}));
console.log('PC15 virtual sample IRQ clock preserves exact PIT rate and block partitions, multiple IRQs/sample, explicit timer restoration');
