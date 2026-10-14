import assert from 'node:assert/strict';
import {createTandyDacSampleClock} from '../lib/game/tandy-dac-sample-clock.ts';
for(const rate of [44100,48000])for(const divisor of [1,4,123,4095]){
 const whole=createTandyDacSampleClock(rate,3579545,divisor,7),split=createTandyDacSampleClock(rate,3579545,divisor,7);
 const expected=whole.advance(1000),actual:number[]=[];let elapsed=0;
 for(const count of [0,1,17,100,333,549]){actual.push(...split.advance(count).map(frame=>frame+elapsed));elapsed+=count;}
 assert.deepEqual(actual,expected);assert.deepEqual(split.snapshot(),whole.snapshot());
 const totalClocks=Math.floor(1000*3579545/rate);assert.equal(expected.length,Math.floor(totalClocks/divisor));
 for(let edge=1;edge<=expected.length;edge++)assert.equal(expected[edge-1],Math.ceil(edge*divisor*rate/3579545));
 const before=split.snapshot();assert.throws(()=>split.advance(-1),/span/);assert.throws(()=>split.write(0xc6,256),/byte/);assert.deepEqual(split.snapshot(),before);
 split.write(0xc6,123);const after=split.snapshot();assert.equal(after.remaining,after.divisor);assert.equal(after.phase,before.phase);
 split.advance(1);split.write(0xc7,0xe1);assert.equal(split.snapshot().divisor,379);assert.equal(split.snapshot().volume,7);assert.equal(split.snapshot().remaining,379);
}
for(const args of [[0,3579545],[48000,0],[48000,1.5],[48000,Number.MAX_SAFE_INTEGER]])assert.throws(()=>createTandyDacSampleClock(args[0],args[1],123,7),/profile/);
console.log('Supplied Tandy chip clock maps divider requests exactly across split audio spans, register reloads and multiple requests per sample; no DMA/BIOS/IRQ delivery inferred');
