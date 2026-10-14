import assert from 'node:assert/strict';
import {stepMs91TandyDifferentialSample} from '../lib/game/ms91-tandy-differential-sample.ts';
const deltas=[-34,-21,-13,-8,-5,-3,-2,-1,0,1,2,3,5,8,13,21];
let count=0;
for(const phase of [0,255])for(let nibble=0;nibble<16;nibble++)for(let accumulator=0;accumulator<256;accumulator++){
 const packed=(nibble<<4)|nibble,before=Object.freeze({phase,packed,accumulator,lastOutput:accumulator});
 const expected=(accumulator+deltas[nibble]+256)&255;
 const actual=stepMs91TandyDifferentialSample(before,phase===0?packed:undefined);
 assert.deepEqual(actual,{state:{phase:phase^255,packed,accumulator:expected,lastOutput:expected},consumed:phase===0?1:0,writes:expected===accumulator?[]:[[0xc5,expected]]});
 count++;
}
const before={phase:0,packed:0,accumulator:0,lastOutput:0};
for(const sample of [undefined,-1,256,NaN,0.5])assert.throws(()=>stepMs91TandyDifferentialSample(before,sample));
for(const key of ['phase','packed','accumulator','lastOutput'])assert.throws(()=>stepMs91TandyDifferentialSample({...before,[key]:256},0));
console.log(`TD15 differential decoder: ${count} phase/nibble/wrap cases; explicit sample requirement, suppressed duplicate output, invalid bytes rejected and input state unchanged`);
