import assert from 'node:assert/strict';
import {allocateOriginalReplayCheckpoints} from '../lib/game/allocate-replay-checkpoints.ts';
const d=0x20000;
function base(available=0x9000){
 const memory=new Uint8Array(0xa0000),v=new DataView(memory.buffer);
 const put=(offset:number,value:number)=>v.setUint16(d+offset,value,true);
 put(0x4b14,0x1000);put(0x4b16,0x2000);put(0x4b18,0x2000);
 put(0x1000+14,0x4000);put(0x2000+14,available);
 return memory;
}
const memory=base(),unchanged=memory.slice();
const normal=allocateOriginalReplayCheckpoints(memory,d);
assert.deepEqual(normal,allocateOriginalReplayCheckpoints(memory,d,'mcga',20));
assert.deepEqual(normal,allocateOriginalReplayCheckpoints(memory,d,'mcga',20,'ms-1990'));
for(const fps of [10,20] as const){
 const modern=allocateOriginalReplayCheckpoints(memory,d,'mcga',fps,'ms-1991');assert.equal(modern.error,null);
 const v=new DataView(modern.memory.buffer),slots=12000/(30*fps);
 assert.equal(v.getUint16(d+modern.descriptor+12,true),(slots*1120+48)/16+1);
}
for(const fps of [10,20] as const){
 const result=allocateOriginalReplayCheckpoints(memory,d,'mcga',fps);
 assert.equal(result.error,null);
 const v=new DataView(result.memory.buffer),slots=12000/(30*fps);
 const pages=v.getUint16(d+result.descriptor+12,true);
 assert.equal(pages,slots*0x430/16+1);
 assert.ok(pages*16>=slots*0x430);
 assert.equal(v.getUint16(d+0xa030,true),result.offset);
 assert.equal(v.getUint16(d+0xa032,true),result.segment);
 assert.equal(allocateOriginalReplayCheckpoints(base(0x4100),d,'mcga',fps).error,'space');
}
assert.deepEqual(memory,unchanged);
console.log('Checkpoint allocator reserves 20/40 canonical slots, preserves input and fails on insufficient space');
