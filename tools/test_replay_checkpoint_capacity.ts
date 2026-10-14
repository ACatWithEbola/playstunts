import assert from 'node:assert/strict';
import {hasReplayCheckpointCapacity} from '../lib/game/replay-checkpoint-capacity.ts';
const d=0x2d1a0,memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),descriptor=0x7000,base=0x60000;
const set=(at:number,value:number)=>v.setUint16(d+at,value,true);
set(0x4b12,descriptor);set(0x4b14,descriptor);set(descriptor+14,base/16);set(descriptor+16,2);
for(const mode of ['mcga','cga','tandy','ega'] as const){
 const pointer=0xa030+{mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode];set(pointer,0);set(pointer+2,base/16);
 for(const rate of [10,20] as const){
  const pages=12000/(30*rate)*0x430/16;set(descriptor+12,pages);
  assert.equal(hasReplayCheckpointCapacity(memory,d,rate,mode,'ms-1991'),false,'Canonical allocation cannot retain modern body caches');
  assert.equal(hasReplayCheckpointCapacity(memory,d,rate,mode),true);
  set(descriptor+12,pages-1);assert.equal(hasReplayCheckpointCapacity(memory,d,rate,mode),false);
  set(descriptor+12,pages);set(pointer,1);assert.equal(hasReplayCheckpointCapacity(memory,d,rate,mode),false);set(pointer,0);
  const modernPages=(12000/(30*rate)*1120+48)/16;set(descriptor+12,modernPages);
  assert.equal(hasReplayCheckpointCapacity(memory,d,rate,mode,'ms-1991'),true);
  set(descriptor+12,modernPages-1);assert.equal(hasReplayCheckpointCapacity(memory,d,rate,mode,'ms-1991'),false);
 }
 set(descriptor+12,1341);assert.equal(hasReplayCheckpointCapacity(memory,d,20,mode),true);assert.equal(hasReplayCheckpointCapacity(memory,d,10,mode),false);
 set(descriptor+12,2681);assert.equal(hasReplayCheckpointCapacity(memory,d,10,mode),true);
 set(descriptor+16,1);assert.equal(hasReplayCheckpointCapacity(memory,d,10,mode),false);set(descriptor+16,2);
}
const before=memory.slice();assert.equal(hasReplayCheckpointCapacity(memory,-1,10),false);assert.deepEqual(memory,before);
console.log('Checkpoint capacity is bounded by the resident allocation in all display modes; short, shifted and cached banks fail closed');
