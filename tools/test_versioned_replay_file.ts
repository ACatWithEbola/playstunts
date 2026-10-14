import {test} from 'node:test';
import assert from 'node:assert/strict';
import {exportVersionedReplay,importVersionedReplay} from '../lib/game/versioned-replay-file.ts';
for(const engine of ['bb-1991','ms-1991'] as const)test(`${engine} download conversion is copy-only and preserves every track and input byte`,()=>{
 const stored=new Uint8Array(0x722+1200);
 for(let i=0;i<stored.length;i++)stored[i]=i*17&255;
 new DataView(stored.buffer).setUint16(22,1200,true);
 const original=stored.slice(),modern=exportVersionedReplay(stored,engine);
 assert.deepEqual(stored,original);
 assert.equal(modern.length,stored.length+2);
 assert.deepEqual(modern.subarray(26),stored.subarray(24));
 assert.deepEqual(importVersionedReplay(modern,engine),stored);
 const legacy=exportVersionedReplay(stored,'ms-1990');
 assert.deepEqual(legacy,stored);assert.notEqual(legacy,stored);
 modern[26]^=255;assert.deepEqual(stored,original);
});
test('unsupported cadence and malformed modern lengths fail closed',()=>{
 const canonical=new Uint8Array(0x723);canonical[22]=1;
 const modern=exportVersionedReplay(canonical,'bb-1991');modern[22]=10;
 assert.throws(()=>importVersionedReplay(modern,'bb-1991'));
 modern[22]=20;assert.throws(()=>importVersionedReplay(modern.subarray(0,-1),'bb-1991'));
});
