import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareSharedTrackImport} from '../lib/game/shared-track-import.ts';
import {ORIGINAL_STARTER_TRACKS} from '../lib/game/original-starter-tracks.ts';
import type {NativeStoredFile} from '../lib/game/native-file-store.ts';
import {ms91DemoTrack} from '../lib/game/ms91-demo-track.ts';
const track=ORIGINAL_STARTER_TRACKS.find(track=>track.name==='DEFAULT')!,bytes=Uint8Array.from(track.raw),hash='a'.repeat(64);
test('shared imports also preserve the bundled 1991 demonstration track',()=>{
 const demo=ms91DemoTrack(),before=demo.bytes.slice();
 assert.deepEqual(prepareSharedTrackImport(demo.name,hash,demo.bytes,'C:\\',[]),{selected:demo.name,files:[]});
 const changed=demo.bytes.slice();changed[0]^=1;
 const added=prepareSharedTrackImport(demo.name,hash,changed,'C:\\',[]);
 assert.notEqual(added.selected,demo.name);
 assert.deepEqual(added.files[0].bytes,changed);
 assert.deepEqual(ms91DemoTrack().bytes,before);
});
test('shared original track reuse and modified same-name alias preserve bundled data',()=>{
 assert.deepEqual(prepareSharedTrackImport('DEFAULT',hash,bytes,'C:\\',[]),{selected:'DEFAULT',files:[]});
 const changed=bytes.slice();changed[0]^=1;
 const result=prepareSharedTrackImport('DEFAULT',hash,changed,'C:\\',[]);
 assert.equal(result.selected,'DEFAUAAA');assert.equal(result.files.length,1);assert.notEqual(result.files[0].key,'C:\\DEFAULT.TRK');
 assert.deepEqual(Uint8Array.from(track.raw),bytes);
});
test('saved aliases are reused only for identical content; conflicts choose a free alias',()=>{
 const changed=bytes.slice();changed[0]^=1;
 const existing:NativeStoredFile[]=[{key:'c:\\custom.trk',bytes:changed,order:9},{key:'c:\\custoaaa.trk',bytes:changed.slice()}];
 const before=structuredClone(existing);
 assert.deepEqual(prepareSharedTrackImport('CUSTOM',hash,changed,'C:\\',existing),{selected:'CUSTOM',files:[]});
 const added=prepareSharedTrackImport('CUSTOM',hash,bytes,'C:\\',existing);
 assert.equal(added.selected,'CUSTAAAA');assert.equal(added.files.length,1);
 assert.deepEqual(existing,before);
 const input=bytes.slice();const result=prepareSharedTrackImport('NEW',hash,input,'C:\\',[]);input[0]^=1;assert.deepEqual(result.files[0].bytes,bytes);
});
test('ambiguous and exhausted aliases reject without replacing retained files',()=>{
 const changed=bytes.slice();changed[0]^=1;
 const ambiguous:NativeStoredFile[]=[{key:'C:\\X.TRK',bytes},{key:'c:\\\\x.trk',bytes:changed}];
 assert.throws(()=>prepareSharedTrackImport('CUSTOM',hash,bytes,'C:\\',ambiguous),/already in use/);
 const occupied=['CUSTOM',...Array.from({length:6},(_,i)=>'CUSTOM'.slice(0,5-i)+'A'.repeat(i+3))].map(name=>({key:'c:\\'+name.toLowerCase()+'.trk',bytes:changed.slice()}));
 const before=structuredClone(occupied);
 assert.throws(()=>prepareSharedTrackImport('CUSTOM',hash,bytes,'C:\\',occupied),/already in use/);
 assert.deepEqual(occupied,before);
 assert.throws(()=>prepareSharedTrackImport('CUSTOM','invalid',bytes,'C:\\',[]),/identity/);
});
