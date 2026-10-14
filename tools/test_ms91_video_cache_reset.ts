import assert from 'node:assert/strict';
import {resetMs91VideoCaches} from '../lib/game/ms91-video-cache-reset.ts';
const memory=new Uint8Array(65536).fill(71),v=new DataView(memory.buffer);
v.setUint16(0x9690,0,true);const before=memory.slice();resetMs91VideoCaches(memory,0);assert.deepEqual(memory,before);
memory.set([0,1,2,3,4,5,6,7],0x92a);memory.set([8,9,10,11,12,13,14,15],0x339a);v.setUint16(0x9690,1,true);
const active=memory.slice();resetMs91VideoCaches(memory,0);
for(const bank of [0xa250,0xa65e]){
 assert.deepEqual(memory.slice(bank,bank+8),active.slice(0x92a,0x932));
 for(let index=1;index<15;index++)assert.deepEqual(memory.slice(bank+index*8,bank+(index+1)*8),active.slice(0x339a,0x33a2));
}
for(let at=0;at<65536;at++)if(![0xa250,0xa65e].some(bank=>at>=bank&&at<bank+120))assert.equal(memory[at],active[at]);
const once=memory.slice();resetMs91VideoCaches(memory,0);assert.deepEqual(memory,once);
assert.throws(()=>resetMs91VideoCaches(new Uint8Array(65535),0),/outside memory/);
console.log('MS91 video-cache reset follows two15-rectangle banks; disabled path, unrelated bytes and repeat calls preserved');
