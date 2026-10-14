import assert from 'node:assert/strict';
import {crashOriginalRaceMemory} from '../lib/game/crash-race-memory.ts';
function run(cause:2|3,fps?:10|20){
 const memory=new Uint8Array(65536),v=new DataView(memory.buffer);
 v.setUint16(0x8c26,100,true);v.setUint16(0x8c30,20,true);v.setUint16(0xa034,600,true);
 v.setUint16(0x8c38+0x2c,1234,true);
 const effects=crashOriginalRaceMemory(memory,0,cause,0,fps);
 return {memory,effects,timer:v.getUint16(0x8c20,true),finish:v.getUint16(0x8c28,true)};
}
for(const cause of [2,3] as const){
 assert.deepEqual(run(cause),run(cause,20));
 for(const rate of [10,20] as const)assert.equal(run(cause,rate).timer,cause===2?4*rate:rate);
}
assert.equal(run(3,10).finish,720);assert.equal(run(3,20).finish,720);
console.log('Direct crash/finish memory events retain cadence-scaled delays and unchanged tick sums/default20');
