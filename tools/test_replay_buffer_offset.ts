import assert from 'node:assert/strict';
import {decodeOriginalReplayFile} from '../lib/game/replay-file.ts';
import {encodeVersionedReplay,decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {nativeFileDownload} from '../lib/game/native-file-download.ts';
const canonical=new Uint8Array(0x722+3);
canonical.set([80,77,73,78]);new DataView(canonical.buffer).setUint16(22,3,true);
canonical.set([1,5,0],0x722);
const backing=Buffer.alloc(canonical.length+128,255),buffer=backing.subarray(64,64+canonical.length);
buffer.set(canonical);
const before=Buffer.from(backing);
const decoded=decodeOriginalReplayFile(buffer);
assert.deepEqual(Array.from(decoded.inputs),[1,5,0]);assert.equal(decoded.trailing.length,0);
for(const engine of ['ms-1990','ms-1991'] as const){
 const actual=encodeVersionedReplay(buffer,engine,20),expected=encodeVersionedReplay(canonical,engine,20);
 assert.deepEqual(actual,expected);
 assert.deepEqual(decodeVersionedReplay(actual,engine).bytes,canonical);
 actual[0]=0;
}
const copied=decodeVersionedReplay(buffer,'ms-1990');copied.bytes[0]=0;
for(const key of ['C:\\OLD.RPL','C:\\TRACK.TRK']){
 const download=nativeFileDownload({key,bytes:buffer});
 assert.deepEqual(download,canonical);download[0]=0;
}
assert.deepEqual(backing,before);
console.log('Replay header reads respect sliced Buffer offsets; both formats round-trip without mutating input');
