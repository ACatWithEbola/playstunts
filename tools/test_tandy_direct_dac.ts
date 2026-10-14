import assert from 'node:assert/strict';
import {createOriginalTandyDirectDac} from '../lib/game/tandy-direct-dac.ts';
const dac=createOriginalTandyDirectDac({mode:0,data:128,frequencyLow:0,amplitudeFrequency:0});
assert.equal(dac.sample(),null);assert.throws(()=>dac.write(0xc5,7),/direct mode/);
dac.write(0xc4,3);
for(let volume=0;volume<8;volume++)for(let data=0;data<256;data++){
 dac.write(0xc7,volume<<5);dac.write(0xc5,data);
 assert.equal(dac.sample()!.value,data);assert.equal(dac.sample()!.gain,volume===0?0:10**((volume-7)*3/20));
}
const before=dac.snapshot();assert.throws(()=>dac.write(0xc4,7),/separate hardware host/);assert.deepEqual(dac.snapshot(),before);
assert.throws(()=>dac.write(0xc5,256),/register byte/);assert.deepEqual(dac.snapshot(),before);
dac.write(0xc6,123);assert.equal(dac.snapshot().frequencyLow,123);assert.equal(dac.sample()!.value,255);
dac.write(0xc4,0);assert.equal(dac.sample(),null);assert.equal(dac.snapshot().data,255,'Mode change does not invent a replacement sample');
console.log('2048 direct Tandy DAC byte/amplitude combinations, explicit mode gating, retained latch state and atomic invalid-write rejection pass; no DMA or analog response claim');
