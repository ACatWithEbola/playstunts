import assert from 'node:assert/strict';
import {beginReplayFrame} from '../lib/game/begin-replay-frame.ts';
import {restoreReplayCheckpoint} from '../lib/game/restore-replay-checkpoint.ts';
import {writeMs91BodyCaches,readMs91BodyCaches} from '../lib/game/ms91-body-cache-memory.ts';
const d=0x20000;
for(const rate of [10,20] as const){
 let memory=new Uint8Array(0x100000),v=new DataView(memory.buffer);
 const set=(offset:number,n:number)=>v.setUint16(d+offset,n,true),slots=12000/(30*rate),descriptor=0x7000;
 set(0x4b12,descriptor);set(0x4b14,descriptor);set(descriptor+14,0x6000);set(descriptor+12,(slots*1120+48)/16+1);set(descriptor+16,2);
 set(0xa030,0);set(0xa032,0x6000);set(0x9c40,0);set(0x9c42,0x5000);set(0xa034,1);
 const expected=new Map<number,{state:Uint8Array;caches:[Uint8Array,Uint8Array]}>();
 for(const index of [0,1,slots-1]){
  v=new DataView(memory.buffer);const frame=index*30*rate;
  memory.fill((index+41)&255,d+0x8ae6,d+0x8ae6+1072);
  for(let sign=0;sign<48;sign++)memory[d+0x8eb0+sign]=(sign+index)%2;
  v.setUint16(d+0x8c26,frame,true);memory[d+0x8eaa]=1;
  const caches:[Uint8Array,Uint8Array]=[new Uint8Array(24).fill(index+1),new Uint8Array(24).fill(index+71)];
  memory=writeMs91BodyCaches(memory,d,rate,caches);
  const saved=beginReplayFrame(memory,d,rate,'ms-1991');assert.equal(saved.checkpoint,index);memory=saved.memory;
  expected.set(index,{state:memory.slice(d+0x8ae6,d+0x8ae6+1072),caches});
 }
 const before=memory.slice();
 for(const [index,snapshot] of expected){
  const altered=memory.slice(),av=new DataView(altered.buffer);av.setUint16(d+0x8c26,11999,true);
  altered.fill(0xff,d+0x8eb0,d+0x8eb0+48);
  const restored=restoreReplayCheckpoint(altered,d,index*30*rate,m=>m,rate,'ms-1991');
  assert.equal(restored.checkpoint,index);
  assert.deepEqual(restored.memory.slice(d+0x8ae6,d+0x8ae6+1072),snapshot.state);
  assert.deepEqual(readMs91BodyCaches(restored.memory,d,rate),snapshot.caches);
  assert.deepEqual(restored.memory.slice(d+0x8eb0,d+0x8eb0+48),snapshot.state.slice(0x8eb0-0x8ae6,0x8eb0-0x8ae6+48),'All broken-sign markers restored');
 }
 assert.deepEqual(memory,before);
}
console.log('Modern checkpoints restore canonical state and both body caches at first/intermediate/final slots for10/20Hz; source unchanged');
