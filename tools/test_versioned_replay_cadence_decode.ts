import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeVersionedReplay,encodeVersionedReplay,exportVersionedReplay,importVersionedReplay} from '../lib/game/versioned-replay-file.ts';
const canonical=new Uint8Array(readFileSync(new URL('../public/game/replays/CTKFIN.RPL',import.meta.url)));
const source=exportVersionedReplay(canonical,'ms-1991');
for(const rate of [10,20] as const){
 const file=source.slice();new DataView(file.buffer).setUint16(22,rate,true);const before=file.slice();
 const decoded=decodeVersionedReplay(file,'ms-1991');
 assert.deepEqual(encodeVersionedReplay(canonical,'ms-1991',rate),file);
 assert.equal(decoded.framesPerSecond,rate);assert.deepEqual(decoded.bytes,canonical);assert.deepEqual(file,before);
 if(rate===10)assert.throws(()=>importVersionedReplay(file,'ms-1991'),/Only 20 Hz/);
 else assert.deepEqual(importVersionedReplay(file,'ms-1991'),canonical);
}
for(const rate of [0,15,30,65535]){
 const file=source.slice();new DataView(file.buffer).setUint16(22,rate,true);
 assert.throws(()=>decodeVersionedReplay(file,'ms-1991'),/Unsupported replay cadence/);
}
assert.deepEqual(decodeVersionedReplay(canonical,'ms-1990'),{bytes:canonical,framesPerSecond:20});
assert.throws(()=>encodeVersionedReplay(canonical,'ms-1990',10),/requires20 Hz/);
assert.deepEqual(encodeVersionedReplay(canonical,'ms-1990',20),canonical);
console.log('Cadence-aware inspection preserves bytes/rate; generic20Hz import rejects slow mode, separate private import is cadence-aware');
