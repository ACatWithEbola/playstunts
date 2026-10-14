import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {effectiveNativeDownloads} from '../lib/game/native-download-catalog.ts';
import type {NativeStoredFile} from '../lib/game/native-file-store.ts';
import {createNativeFileStore} from '../lib/game/native-file-store.ts';
import {nativeFileDownload} from '../lib/game/native-file-download.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
test('download list matches DOS overlays and preserves saved engine/cadence/key/bytes',()=>{
 const bundled:NativeStoredFile[]=[{key:'C:\\DEFAULT.RPL',bytes:new Uint8Array([1])},{key:'C:\\DEFAULT.TRK',bytes:new Uint8Array([2])}];
 const saved:NativeStoredFile[]=[{key:'c:\\default.rpl',bytes:new Uint8Array([3]),physicsEngine:'ms-1991',framesPerSecond:10,order:8},{key:'c:\\\\default.trk',bytes:new Uint8Array([4]),order:9},{key:'C:\\SUB\\DEFAULT.RPL',bytes:new Uint8Array([5]),physicsEngine:'bb-1991'},{key:'C:\\DEFAULT.M91',bytes:new Uint8Array(364)}];
 const before=structuredClone({bundled,saved});
 const downloads=effectiveNativeDownloads(bundled,saved);
 assert.equal(downloads.length,3);
 for(const file of saved.slice(0,3))assert.deepEqual(downloads.find(item=>item.key===file.key),file);
 assert.ok(!downloads.some(file=>file.key==='C:\\DEFAULT.RPL'||file.key==='C:\\DEFAULT.TRK'));
 downloads[0].bytes.fill(255);assert.deepEqual({bundled,saved},before);
 const untouched=effectiveNativeDownloads(bundled,[]);assert.deepEqual(untouched,bundled);
 const source=readFileSync(new URL('../app/SaveBackupPanel.tsx',import.meta.url),'utf8');
 assert.match(source,/setDownloads\(effectiveNativeDownloads\(/,'Download panel must use effective DOS overlay catalog');
});
test('ambiguous saved aliases cannot select an arbitrary edition for download',()=>{
 const files:NativeStoredFile[]=[{key:'C:\\RUN.RPL',bytes:new Uint8Array([1])},{key:'c:\\\\run.rpl',bytes:new Uint8Array([2]),physicsEngine:'ms-1991'}];
 const before=structuredClone(files);
 assert.throws(()=>effectiveNativeDownloads([],files),/Ambiguous stored DOS filename/);assert.deepEqual(files,before);
});
test('effective download and game loader agree on real aliased replay engine/rate/bytes',async()=>{
 const bytes=new Uint8Array(readFileSync(new URL('../public/game/replays/CTKFIN.RPL',import.meta.url)));
 const original=[{key:'C:\\DEFAULT.RPL',bytes:bytes.slice()}];
 const saved:NativeStoredFile[]=[{key:'c:\\default.rpl',bytes:bytes.slice(),physicsEngine:'ms-1991',framesPerSecond:10,order:5}];
 const before=structuredClone(saved);
 const game=await createNativeFileStore(new Map(original.map(file=>[file.key,async()=>file.bytes.slice()])),{all:async()=>saved,put:async()=>{assert.fail('Read path must not write');}});
 const downloads=effectiveNativeDownloads(original,saved);assert.equal(downloads.length,1);
 const decoded=decodeVersionedReplay(nativeFileDownload(downloads[0]),game.physicsEngine('','DEFAULT','.rpl'));
 assert.equal(decoded.framesPerSecond,game.framesPerSecond('','DEFAULT','.rpl'));
 assert.deepEqual(decoded.bytes,await game.read('','DEFAULT','.rpl'));
 assert.deepEqual(saved,before);game.close();
});
