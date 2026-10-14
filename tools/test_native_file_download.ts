import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nativeFileDownload} from '../lib/game/native-file-download.ts';
import {importVersionedReplay,decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
test('private modern exports round-trip without changing saved replay or track bytes',()=>{
 const bytes=new Uint8Array(readFileSync(new URL('../public/game/replays/CTKFIN.RPL',import.meta.url))),original=bytes.slice();
 const legacy=nativeFileDownload({key:'C:\\OLD.RPL',bytes});assert.deepEqual(legacy,bytes);assert.notEqual(legacy,bytes);
 for(const physicsEngine of ['ms-1991','bb-1991'] as const){
  const output=nativeFileDownload({key:'C:\\NEW.RPL',bytes,physicsEngine});
  assert.equal(output.length,bytes.length+2);assert.deepEqual(importVersionedReplay(output,physicsEngine),bytes);
 }
 const track=bytes.slice(24,0x722);assert.deepEqual(nativeFileDownload({key:'C:\\TRACK.TRK',bytes:track}),track);
 assert.deepEqual(bytes,original);
});
test('unsupported cadence cannot become a falsely labelled download',()=>{
 const bytes=new Uint8Array(readFileSync(new URL('../public/game/replays/CTKFIN.RPL',import.meta.url))),before=bytes.slice();
 for(const physicsEngine of ['ms-1990','ms-1991','bb-1991'] as const){
  if(physicsEngine==='ms-1991'){
   const decoded=decodeVersionedReplay(nativeFileDownload({key:'C:\\SLOW.RPL',bytes,physicsEngine,framesPerSecond:10}),physicsEngine);
   assert.equal(decoded.framesPerSecond,10);assert.deepEqual(decoded.bytes,bytes);
  }else assert.throws(()=>nativeFileDownload({key:'C:\\SLOW.RPL',bytes,physicsEngine,framesPerSecond:10}),/10 Hz replay downloads/);
  assert.deepEqual(nativeFileDownload({key:'C:\\FAST.RPL',bytes,physicsEngine,framesPerSecond:20}),nativeFileDownload({key:'C:\\FAST.RPL',bytes,physicsEngine}));
 }
 assert.deepEqual(bytes,before);
});
test('invalid recorded metadata fails without mutating the retained recording',()=>{
 const bytes=new Uint8Array(readFileSync(new URL('../public/game/replays/CTKFIN.RPL',import.meta.url))),before=bytes.slice();
 for(const physicsEngine of ['unknown','MS-1991','',false,1991])assert.throws(()=>nativeFileDownload({key:'c:\\saved.rpl',bytes,physicsEngine:physicsEngine as never}),/Unsupported physics/);
 for(const framesPerSecond of [0,15,30,'20',null,NaN])assert.throws(()=>nativeFileDownload({key:'c:\\saved.rpl',bytes,physicsEngine:'ms-1991',framesPerSecond:framesPerSecond as never}),/Unsupported replay cadence/);
 assert.deepEqual(bytes,before);
 const exported=nativeFileDownload({key:'c:\\saved.rpl',bytes,physicsEngine:'ms-1991',framesPerSecond:20});exported.fill(255);assert.deepEqual(bytes,before,'Caller mutation of download cannot alter stored controls');
});
