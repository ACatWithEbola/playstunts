import assert from 'node:assert/strict';
import {configureMs91ModelRegion,ms91RedrawModelRecord} from '../lib/game/ms91-model-region-policy.ts';
for(const kind of ['first','second'] as const)for(const enabled of [0,1,65535])for(const visibility of [0,1,2]){
 const memory=new Uint8Array(65536),v=new DataView(memory.buffer);v.setUint16(0xb138,0x1000,true);v.setUint16(0x9690,enabled,true);v.setUint16(0x1008,0xaaaa,true);memory[kind==='first'?0x93bb:0x948b]=visibility;memory.set([1,2,3,4,5,6,7,8],0x339a);
 const before=memory.slice(),local=0xe000-(kind==='first'?0x6a:0x8e);configureMs91ModelRegion(memory,0,0xe000,kind);
 assert.equal(v.getUint16(0x1008,true),enabled?(kind==='first'?0x9728:0x9730):visibility===1?local:0xaaaa);assert.equal(memory[0x1012],enabled||visibility===1?12:4);
 if(!enabled&&visibility===1)assert.deepEqual(memory.slice(local,local+8),before.slice(0x339a,0x33a2));
 for(let i=0;i<memory.length;i++)if(memory[i]!==before[i])assert.ok(i===0x1008||i===0x1009||i===0x1012||(!enabled&&visibility===1&&i>=local&&i<local+8));
}
console.log('MS91 model-region routing: enabled banks, visibility paths and bounded writes pass');
for(let flags=0;flags<256;flags++){
 const record=Array.from({length:20},(_,i)=>i);record[18]=flags;const before=[...record],enabled=ms91RedrawModelRecord(record,true),disabled=ms91RedrawModelRecord(record,false);
 const expected=[...record];expected[18]=flags|8;assert.deepEqual(enabled,expected);assert.deepEqual(disabled,record);assert.deepEqual(record,before);
}
assert.throws(()=>ms91RedrawModelRecord([],true),/twenty/);
console.log('MS91 scene redraw bit preserves every other descriptor byte across all256 flag values');
