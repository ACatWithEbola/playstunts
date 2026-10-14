import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareSharedReplayImport} from '../lib/game/shared-replay-import.ts';
import type {NativeStoredFile} from '../lib/game/native-file-store.ts';

test('same canonical replay cannot reuse a local file from a different engine',()=>{
 const source=new Uint8Array(0x723);
 source.set(new TextEncoder().encode('PMIN'));
 source.set(new TextEncoder().encode('CUSTOM'),13);
 source[22]=1;source[0x722]=1;
 const original=source.slice(),id='abcdef0'.padEnd(64,'0');
 const existing:NativeStoredFile[]=[{key:'C:\\RABCDEF0.RPL',bytes:source.slice(),order:1}];
 const before=structuredClone(existing);
 assert.equal(prepareSharedReplayImport(source,id,'',existing).files.length,1);
 for(const engine of ['bb-1991','ms-1991'] as const){
  assert.throws(()=>prepareSharedReplayImport(source,id,'',existing,engine));
  const tagged=existing.map(file=>({...file,physicsEngine:engine}));
  assert.equal(prepareSharedReplayImport(source,id,'',tagged,engine).files.length,1);
  assert.throws(()=>prepareSharedReplayImport(source,id,'',tagged,'ms-1990'));
 }
 assert.deepEqual(existing,before);assert.deepEqual(source,original);
});

test('shared import respects retained case aliases before choosing engine or track',()=>{
 const source=new Uint8Array(0x723);source.set(new TextEncoder().encode('CUSTOM'),13);source[22]=1;source[0x722]=1;
 const id='abcdef0'.padEnd(64,'0');
 const existing:NativeStoredFile[]=[{key:'c:\\rabcdef0.rpl',bytes:source.slice(),physicsEngine:'ms-1991',order:3}];
 const before=structuredClone(existing),original=source.slice();
 assert.throws(()=>prepareSharedReplayImport(source,id,'C:\\',existing,'ms-1990'),/already exists/,'A differently cased replay is still the same DOS file');
 assert.deepEqual(existing,before);assert.deepEqual(source,original);
 const matching=prepareSharedReplayImport(source,id,'C:\\',existing,'ms-1991');
 assert.equal(matching.files.filter(file=>file.key.endsWith('.RPL')).length,0,'Matching tagged alias is reused, not falsely reported as a new file');
});
test('public20Hz import never reuses identical private10Hz controls',()=>{
 const source=new Uint8Array(0x723);source.set(new TextEncoder().encode('CUSTOM'),13);source[22]=1;source[0x722]=1;
 const id='abcdef0'.padEnd(64,'0');
 const slow:NativeStoredFile[]=[{key:'c:\\rabcdef0.rpl',bytes:source.slice(),physicsEngine:'ms-1991',framesPerSecond:10,order:4}];
 const before=structuredClone(slow),original=source.slice();
 assert.throws(()=>prepareSharedReplayImport(source,id,'C:\\',slow,'ms-1991'),/already exists/,'Equal engine and canonical bytes do not imply equal recorded cadence');
 for(const framesPerSecond of [undefined,20] as const){
  const matching=slow.map(file=>({...file,framesPerSecond}));
  assert.equal(prepareSharedReplayImport(source,id,'C:\\',matching,'ms-1991').files.filter(file=>file.key.endsWith('.RPL')).length,0);
 }
 assert.deepEqual(slow,before);assert.deepEqual(source,original);
});
