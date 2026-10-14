import assert from 'node:assert/strict';
import {saveNativeReplayMemory} from '../lib/game/native-replay-memory-save.ts';
import {saveNativeReplay} from '../lib/game/native-replay-save.ts';

for(const mode of ['success','status-error','throw']){
 const memory=Uint8Array.from({length:0x100000},(_,i)=>i&255),d=0x2d1a0,view=new DataView(memory.buffer);
 view.setUint16(d+0xa772,0x20,true);view.setUint16(d+0xa774,0x5000,true);view.setUint16(d+0x8fd8,12000,true);
 memory[d+0x135]=0;const before=memory.slice(),target=0x50020;
 const expected=before.slice();expected.set(before.subarray(d+0x8fc2,d+0x8fc2+24),target);
 let calls=0;const failure=Error('Storage write failed');
 const pending=saveNativeReplayMemory(memory,d,{async write(offset,segment,length){
  calls++;assert.equal(memory[d+0x135],1);assert.equal(offset,0x20);assert.equal(segment,0x5000);assert.equal(length,0x722+12000);
  assert.deepEqual(memory,Uint8Array.from(expected,(value,index)=>index===d+0x135?1:value));
  if(mode==='throw')throw failure;return mode==='success'?0:255;
 }});
 if(mode==='throw')await assert.rejects(pending,error=>error===failure);
 else assert.equal(await pending,mode==='success'?0:-1);
 assert.equal(calls,1);assert.deepEqual(memory,expected,'Save refreshes only its header and always releases the write-in-progress flag');
}
{
 const events:string[]=[];let edits=0,writes=0;
 const result=await saveNativeReplay({async pauseAudio(){events.push('pause');},async editName(){events.push('edit');edits++;return true;},buildPath(){events.push('path');},async exists(){return false;},async dialog(resource){events.push(resource);return 0;},async write(){events.push('write');return ++writes===1?1:0;}});
 assert.equal(result,true);assert.equal(edits,2);assert.equal(writes,2);
 assert.deepEqual(events,['pause','edit','path','write','eser','edit','path','write']);
}
for(const choice of [-1,0]){
 let writes=0,edits=0;
 const saved=await saveNativeReplay({async pauseAudio(){},async editName(){return ++edits===1;},buildPath(){},async exists(){return true;},async dialog(resource){assert.equal(resource,'efex');return choice;},async write(){writes++;return 0;}});
 assert.equal(saved,false);assert.equal(writes,0,'Cancel or rename must not overwrite the retained replay');
}
console.log('Replay memory saves clear write flags after status/rejection failures; retry/error/cancel/rename flows never falsely report a save');
