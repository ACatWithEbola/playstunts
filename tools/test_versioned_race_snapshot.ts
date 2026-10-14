import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {packVersionedRaceSnapshot,unpackVersionedRaceSnapshot} from '../lib/game/versioned-race-snapshot.ts';
const canonical=Uint8Array.from({length:1072},(_,i)=>(i*37+11)&255),before=canonical.slice();
const caches:[Uint8Array,Uint8Array]=[new Uint8Array(24).fill(91),new Uint8Array(24).fill(199)];
for(const engine of ['ms-1990','ms-1991'] as const){
 const packed=packVersionedRaceSnapshot(canonical,engine,caches),restored=unpackVersionedRaceSnapshot(packed,engine);
 assert.equal(packed.length,engine==='ms-1990'?1072:1120);assert.deepEqual(restored.canonical,canonical);
 if(engine==='ms-1991')assert.deepEqual(restored.caches,caches);else assert.equal(restored.caches,undefined);
 packed[0]=0;restored.canonical[0]=0;if(restored.caches)restored.caches[0][0]=0;
 assert.deepEqual(canonical,before);assert.equal(caches[0][0],91);
}
assert.throws(()=>packVersionedRaceSnapshot(canonical,'ms-1991'),/both24-byte/);
assert.throws(()=>unpackVersionedRaceSnapshot(canonical,'ms-1991'),/1120/);
for(const path of process.argv.slice(2)){
 const source=readFileSync(path),v=new DataView(source.buffer,source.byteOffset,source.byteLength),frames=v.getUint16(0,true);
 assert.equal(source.length,2+1120*frames);assert.ok(frames>0);
 for(let frame=0;frame<frames;frame++){
  const original=Uint8Array.from(source.subarray(2+1120*frame,2+1120*(frame+1))),restored=unpackVersionedRaceSnapshot(original,'ms-1991');
  assert.deepEqual(packVersionedRaceSnapshot(restored.canonical,'ms-1991',restored.caches),original,'Original capture frame '+(frame+1));
 }
 assert.deepEqual(readFileSync(path),source);console.log(frames+' original1120-byte snapshots round-trip exactly');
}
console.log('Versioned snapshot round-trips both caches while preserving exact legacy state bytes; checkpoint integration remains separate');
