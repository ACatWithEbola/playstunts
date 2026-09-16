import assert from 'node:assert/strict';
import {test} from 'node:test';
import {consumeRaceAudio,consumeRaceAudioInPlace,tickRaceAudioMemory} from '../lib/game/consume-race-audio.ts';
import {produceRaceAudio,produceRaceAudioInPlace} from '../lib/game/produce-race-audio.ts';

const d=0x20000;
function raceMemory(){
 const memory=new Uint8Array(1<<20),view=new DataView(memory.buffer);
 memory[d+0x8fc8]=1;
 memory[d+0x12f]=0;
 view.setUint16(d+0x8016,2,true);
 view.setUint16(d+0x86de,3,true);
 view.setUint16(d+0x8ffc,1,true);
 view.setUint16(d+0x8c38+34,3200,true);
 view.setUint16(d+0x8cf0+34,2800,true);
 return memory;
}

function offsetCopy(memory:Uint8Array){
 const backing=new Uint8Array(memory.length+73),copy=backing.subarray(37,37+memory.length);
 copy.set(memory);return copy;
}

await test('in-place race-audio producer is byte-identical to the pure wrapper',()=>{
 const before=raceMemory(),unchanged=before.slice(),pure=produceRaceAudio(before,d),direct=before.slice();
 const result=produceRaceAudioInPlace(direct,d);
 assert.deepEqual(before,unchanged,'pure compatibility wrapper must not mutate its input');
 assert.deepEqual(direct,pure.memory);
 assert.deepEqual(result,{requests:pure.requests,record:pure.record});
});

await test('in-place race-audio producer respects a Uint8Array byte offset',()=>{
 const before=raceMemory(),expected=produceRaceAudio(before,d),direct=offsetCopy(before);
 const result=produceRaceAudioInPlace(direct,d);
 assert.deepEqual(direct,expected.memory);
 assert.deepEqual(result,{requests:expected.requests,record:expected.record});
});

await test('in-place audio-exit producer remains identical to the pure wrapper',()=>{
 const before=raceMemory();before[d+0x9aca]=1;before[d+0x9fea]=1;
 const expected=produceRaceAudio(before,d),direct=offsetCopy(before),result=produceRaceAudioInPlace(direct,d);
 assert.deepEqual(direct,expected.memory);
 assert.deepEqual(result,{requests:expected.requests,record:expected.record});
});

await test('in-place race-audio consumer is byte-identical and offset-safe',()=>{
 const before=raceMemory(),view=new DataView(before.buffer);
 view.setUint16(d+0x8a46,4,true);
 view.setUint16(d+0x9332,0,true);
 view.setUint16(d+0x8ffc,1,true);
 const unchanged=before.slice(),pure=consumeRaceAudio(before,d,true),direct=offsetCopy(before);
 const targets=consumeRaceAudioInPlace(direct,d,true);
 assert.deepEqual(before,unchanged,'pure compatibility wrapper must not mutate its input');
 assert.deepEqual(direct,pure.memory);
 assert.deepEqual(targets,pure.targets);
});

await test('timer tick mutates its owned image without replacing it',()=>{
 const memory=raceMemory(),view=new DataView(memory.buffer);
 view.setUint16(d+0x8a46,4,true);
 view.setUint16(d+0x9332,0,true);
 view.setUint16(d+0x8ffc,1,true);
 const updated:number[]=[];
 const result=tickRaceAudioMemory(memory,d,true,{tick:()=>[[1,2]],update(handle){updated.push(handle);}});
 assert.equal(result.memory,memory);
 assert.deepEqual(result.writes,[[1,2]]);
 assert.deepEqual(updated,[2,3]);
});
