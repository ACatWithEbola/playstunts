import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareSharedReplayImport,sharedReplayTrackName} from '../lib/game/shared-replay-import.ts';
import {ORIGINAL_STARTER_TRACKS} from '../lib/game/original-starter-tracks.ts';
import {createNativeFileStore,nativeFileKey,type NativeStoredFile} from '../lib/game/native-file-store.ts';
import {scoreString} from '../lib/game/global-score-format.ts';
import {ms91DemoTrack} from '../lib/game/ms91-demo-track.ts';
const track=ORIGINAL_STARTER_TRACKS.find(t=>t.name==='DEFAULT')!,id='1234567'+'a'.repeat(57);
const replay=(name='T4111E30',raw=track.raw)=>{const b=new Uint8Array(0x723);b.set(Array.from(name,c=>c.charCodeAt(0)),13);b.set(raw,24);b[0x722]=4;return b;};
test('shared replay reuses bundled VANCOUVR and rejects a conflicting embedded track',()=>{
 const demo=ms91DemoTrack(),source=replay(demo.name,Array.from(demo.bytes)),before=source.slice();
 const result=prepareSharedReplayImport(source,id,'C:\\',[],'ms-1991');
 assert.equal(result.files.length,1);assert.ok(result.files[0].key.endsWith('.RPL'));
 assert.equal(scoreString(result.files[0].bytes,13,22),demo.name);
 assert.equal(result.files[0].physicsEngine,'ms-1991');
 assert.deepEqual(source,before);
 const changed=Array.from(demo.bytes);changed[0]^=1;
 assert.throws(()=>prepareSharedReplayImport(replay(demo.name,changed),id,'C:\\',[],'ms-1991'),/already exists/);
});
test('original downloads retain canonical names; custom downloads retain collision-safe aliases',()=>{
 assert.equal(sharedReplayTrackName(track.sha256),'DEFAULT');
 assert.equal(sharedReplayTrackName('a'.repeat(64)),'TAAAAAAA');
});
test('import reuses DEFAULT without creating a duplicate track or modifying replay inputs',()=>{
 const source=replay(),result=prepareSharedReplayImport(source,id,'C:\\',[]);
 assert.equal(result.files.length,1);assert.ok(result.files[0].key.endsWith('.RPL'));
 assert.equal(scoreString(result.files[0].bytes,13,22),'DEFAULT');
 assert.equal(scoreString(source,13,22),'T4111E30');
 assert.deepEqual(result.files[0].bytes.slice(24),source.slice(24));
});
test('matching custom tracks are reused and saved tracks are never overwritten',()=>{
 const raw=[...track.raw];raw[0]=1;const source=replay('TAAAAAAA',raw);
 const existing=[{key:nativeFileKey('','MYTRACK','.trk'),bytes:Uint8Array.from(raw)}];
 const result=prepareSharedReplayImport(source,id,'C:\\',existing);
 assert.equal(result.files.length,1);assert.equal(scoreString(result.files[0].bytes,13,22),'MYTRACK');
 assert.throws(()=>prepareSharedReplayImport(replay('DEFAULT'),id,'C:\\',[{key:nativeFileKey('','DEFAULT','.trk'),bytes:Uint8Array.from(raw)}]),/already exists/);
});
test('legacy imported replay is preserved on repeated import',()=>{
 const bytes=replay();const old={key:nativeFileKey('','R1234567','.rpl'),bytes};
 assert.equal(prepareSharedReplayImport(bytes,id,'C:\\',[old]).files.length,0);
 assert.equal(scoreString(old.bytes,13,22),'T4111E30');
});
test('saved track aliases override bundled tracks and matching aliases are reused',()=>{
 const changed=Uint8Array.from(track.raw);changed[0]=1;
 const conflict:NativeStoredFile[]=[{key:'c:\\default.trk',bytes:changed,order:4}];
 const before=structuredClone(conflict);
 assert.throws(()=>prepareSharedReplayImport(replay('DEFAULT'),id,'C:\\',conflict),/already exists/);
 assert.deepEqual(conflict,before);
 const custom:NativeStoredFile[]=[{key:'c:\\mytrack.trk',bytes:changed,order:5}];
 const imported=prepareSharedReplayImport(replay('TAAAAAAA',Array.from(changed)),id,'C:\\',custom);
 assert.equal(imported.files.length,1);assert.equal(scoreString(imported.files[0].bytes,13,22),'MYTRACK');
 assert.equal(custom[0].key,'c:\\mytrack.trk');
});
test('ambiguous DOS aliases fail without choosing or changing either retained file',()=>{
 const files:NativeStoredFile[]=[{key:'C:\\CUSTOM.TRK',bytes:Uint8Array.from(track.raw)},{key:'c:\\\\custom.trk',bytes:Uint8Array.from(track.raw)}];
 const before=structuredClone(files);
 assert.throws(()=>prepareSharedReplayImport(replay(),id,'C:\\',files),/already exists/);
 assert.deepEqual(files,before);
});
test('legacy exact starter aliases disappear from chooser but remain readable; modified tracks remain visible',async()=>{
 const alias=nativeFileKey('','T4111E30','.trk'),canonical=nativeFileKey('','DEFAULT','.trk');
 const originals=new Map([[canonical,async()=>Uint8Array.from(track.raw)]]);
 const files:NativeStoredFile[]=[{key:alias,bytes:Uint8Array.from(track.raw)}];
 const store=await createNativeFileStore(originals,{all:async()=>files,put:async()=>{}});
 assert.deepEqual(store.enumerate('','.trk'),['DEFAULT.TRK']);
 assert.deepEqual(await store.read('','T4111E30','.trk'),Uint8Array.from(track.raw));
 const modified=Uint8Array.from(track.raw);modified[0]=1;
 const other=await createNativeFileStore(originals,{all:async()=>[{key:alias,bytes:modified}],put:async()=>{}});
 assert.ok(other.enumerate('','.trk').includes('T4111E30.TRK'));
 const overridden=await createNativeFileStore(originals,{all:async()=>[...files,{key:canonical,bytes:modified}],put:async()=>{}});
 assert.ok(overridden.enumerate('','.trk').includes('T4111E30.TRK'));
});
