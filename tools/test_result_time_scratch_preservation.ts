import assert from 'node:assert/strict';
import {writeOriginalRaceResultTimeScratch,writeMs91ResultTimeFields} from '../lib/game/race-result-time-scratch.ts';
const d=0x20000,bp=0xeefe,base=new Uint8Array(0x100000).fill(71);
function run(metadata={}){
 const memory=base.slice();
 writeOriginalRaceResultTimeScratch(memory,d,bp,{playerTime:650,penaltyTime:50,opponentTime:700,opponentSelected:1,flags:1,...metadata});
 return memory;
}
assert.deepEqual(run(),run({physicsEngine:'ms-1990',framesPerSecond:20}));
const modern=base.slice();writeMs91ResultTimeFields(modern,d,bp,700,20);
assert.deepEqual(run({physicsEngine:'ms-1991',framesPerSecond:20}),modern);
const slow=base.slice();writeMs91ResultTimeFields(slow,d,bp,700,10);
assert.deepEqual(run({physicsEngine:'ms-1991',framesPerSecond:10}),slow);
for(const rate of [10,20] as const){
 for(const [playerTime,penaltyTime,opponentTime,opponentSelected,lastTicks] of [
  [650,50,700,1,700], [650,50,700,0,50], [650,0,700,0,650],
  [0,0,700,1,700], [0,0,700,0,undefined], [65535,0,0,0,65535],
 ] as const){
  const actual=base.slice(),expected=base.slice();
  writeOriginalRaceResultTimeScratch(actual,d,bp,{playerTime,penaltyTime,opponentTime,opponentSelected,flags:1,physicsEngine:'ms-1991',framesPerSecond:rate});
  if(lastTicks!==undefined)writeMs91ResultTimeFields(expected,d,bp,lastTicks,rate);
  assert.deepEqual(actual,expected,`MS91 final formatter selection at ${rate} Hz`);
 }
}
const output=run(),allowed=new Set([-0xe2,-0xe0,-0xde,-0xdc,-0xd6,-0xd4].flatMap(delta=>[d+((bp+delta)&65535),d+((bp+delta+1)&65535)]));
for(let i=0;i<base.length;i++)if(!allowed.has(i))assert.equal(output[i],base[i]);
const v=new DataView(output.buffer);
assert.equal(v.getUint16(d+bp-0xde,true),0);assert.equal(v.getUint16(d+bp-0xdc,true),35);
console.log('Legacy result scratch remains unchanged; explicitMS91 panels route to original-capture-verified retained fields');
