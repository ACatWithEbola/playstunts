import assert from 'node:assert/strict';
import {restoreReplayCheckpoint} from '../lib/game/restore-replay-checkpoint.ts';
import {beginReplayFrame} from '../lib/game/begin-replay-frame.ts';
import {resetRaceSession} from '../lib/game/reset-race-session.ts';
const d=0x20000,base=0x40000,memory=new Uint8Array(0x80000),view=new DataView(memory.buffer);
view.setUint16(d+0xa030,0,true);view.setUint16(d+0xa032,base/16,true);
view.setUint16(d+0x8c26,1000,true);
for(let index=0;index<40;index++){
 memory[base+index*0x430+0x3c4]=1;
 view.setUint16(base+index*0x430+0x140,index,true);
}
const unchanged=memory.slice(),initialize=(value:Uint8Array)=>value;
const normal=restoreReplayCheckpoint(memory,d,600,initialize);
assert.deepEqual(normal,restoreReplayCheckpoint(memory,d,600,initialize,20));
assert.equal(normal.checkpoint,1);
const slow=restoreReplayCheckpoint(memory,d,600,initialize,10);
assert.equal(slow.checkpoint,2);
assert.equal(new DataView(slow.memory.buffer).getUint16(d+0x8c26,true),2);
assert.equal(restoreReplayCheckpoint(memory,d,6000,initialize,10).checkpoint,20);
assert.equal(restoreReplayCheckpoint(memory,d,12000,initialize,10).checkpoint,39);
assert.equal(restoreReplayCheckpoint(memory,d,12000,initialize,20).checkpoint,19);
assert.throws(()=>restoreReplayCheckpoint(memory,d,12001,initialize,10));
assert.deepEqual(memory,unchanged);
view.setUint16(d+0x9c42,0x6000,true);
view.setUint16(d+0x8c26,300,true);
const snapshot=memory.slice();
assert.equal(beginReplayFrame(memory,d,10).checkpoint,1);
assert.equal(beginReplayFrame(memory,d,20).checkpoint,null);
assert.deepEqual(beginReplayFrame(memory,d),beginReplayFrame(memory,d,20));
assert.deepEqual(memory,snapshot);
view.setUint16(d+0x8c26,600,true);
assert.equal(beginReplayFrame(memory,d,10).checkpoint,2);
assert.equal(beginReplayFrame(memory,d,20).checkpoint,1);
const reset10=resetRaceSession(memory,d,-1,10);
const reset20=resetRaceSession(memory,d,-1,20);
assert.deepEqual(resetRaceSession(memory,d,-1),reset20);
for(let i=0;i<40;i++){
 assert.equal(reset10[base+i*0x430+0x3c4],0);
 assert.equal(reset20[base+i*0x430+0x3c4],i<20?0:1);
}
console.log('Checkpoint cadence selects 300/600-frame spacing without mutating input memory');
