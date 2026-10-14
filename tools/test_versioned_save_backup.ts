import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {encodeSaveBackup,decodeSaveBackup} from '../lib/game/save-backup.ts';
import type {NativeStoredFile} from '../lib/game/native-file-store.ts';
import {ORIGINAL_STARTER_TRACKS} from '../lib/game/original-starter-tracks.ts';
test('backup round-trip preserves lower-case DOS keys, drive and recorded metadata',()=>{
 const replay=new Uint8Array(readFileSync(new URL('../public/game/replays/CTKFIN.RPL',import.meta.url)));
 const files:NativeStoredFile[]=[
  {key:'c:\\saves\\mixed.rpl',bytes:replay,physicsEngine:'ms-1991',framesPerSecond:10,order:7},
  {key:'c:\\saves\\custom.trk',bytes:Uint8Array.from(ORIGINAL_STARTER_TRACKS[0].raw),order:8},
  {key:'c:\\saves\\custom.m10',bytes:new Uint8Array(364).fill(3),physicsEngine:'ms-1991',framesPerSecond:10},
  {key:'c:\\setup.dat',bytes:new TextEncoder().encode('test\r\n')},
 ];
 const before=structuredClone(files),result=decodeSaveBackup(encodeSaveBackup(files,'c:\\saves\\'));
 assert.equal(result.directory,'c:\\saves\\');assert.deepEqual(result.files,before);assert.deepEqual(files,before);
 assert.throws(()=>decodeSaveBackup(encodeSaveBackup([files[0],{...files[0],key:'C:\\SAVES\\MIXED.RPL'}],'c:\\')),/duplicate file/);
});
test('save backup restores explicit replay engines while leaving untagged legacy files untagged',()=>{
 const bytes=new Uint8Array(readFileSync(new URL('../public/game/replays/CTKFIN.RPL',import.meta.url)));
 const files:NativeStoredFile[]=[{key:'C:\\OLD.RPL',bytes,order:1},{key:'C:\\MIND.RPL',bytes:bytes.slice(),order:2,physicsEngine:'ms-1991',framesPerSecond:10},{key:'C:\\BB.RPL',bytes:bytes.slice(),order:3,physicsEngine:'bb-1991',framesPerSecond:20}];
 const snapshot=structuredClone(files);
 const restored=decodeSaveBackup(encodeSaveBackup(files,'C:\\'));
 assert.deepEqual(restored.files,files);assert.deepEqual(files,snapshot);
 for(const alias of ['C:\\old.rpl','C:\\\\OLD.RPL']){
  const ambiguous=encodeSaveBackup([files[0],{...files[0],key:alias,physicsEngine:'ms-1991'}],'C:\\');
  assert.throws(()=>decodeSaveBackup(ambiguous),/duplicate file/,'DOS aliases must not silently collide during restore');
 }
 assert.deepEqual(files,snapshot,'Rejected backup aliases do not mutate existing replay data');
 const malformed=JSON.parse(encodeSaveBackup(files,'C:\\'));malformed.files[1].physicsEngine='latest';
 assert.throws(()=>decodeSaveBackup(JSON.stringify(malformed)),/Unsupported physics/);
 malformed.files[1].physicsEngine='ms-1991';
 for(const rate of [30,null,'20']){malformed.files[1].framesPerSecond=rate;assert.throws(()=>decodeSaveBackup(JSON.stringify(malformed)),/Unsupported replay cadence/);}
});
test('mixed legacy and modern private score tables survive backup without rewriting or merging',()=>{
 const files:NativeStoredFile[]=[{key:'C:\\DEFAULT.HIG',bytes:new Uint8Array(364).fill(1)},{key:'C:\\DEFAULT.M91',bytes:new Uint8Array(364).fill(2),physicsEngine:'ms-1991'},{key:'C:\\DEFAULT.B91',bytes:new Uint8Array(364).fill(3),physicsEngine:'bb-1991'}];
 files.push({key:'C:\\DEFAULT.M10',bytes:new Uint8Array(364).fill(4),physicsEngine:'ms-1991',framesPerSecond:10},{key:'C:\\DEFAULT.B10',bytes:new Uint8Array(364).fill(5),physicsEngine:'bb-1991',framesPerSecond:10});
 const before=structuredClone(files),restored=decodeSaveBackup(encodeSaveBackup(files,'C:\\'));
 assert.deepEqual(restored.files,files);assert.deepEqual(files,before);
 for(const suffix of ['HIG','M91','B91','M10','B10']){
  for(const size of [0,363,365])assert.throws(()=>decodeSaveBackup(encodeSaveBackup([{key:'C:\\DEFAULT.'+suffix,bytes:new Uint8Array(size)}],'C:\\')),/unsupported game file/);
 }
 assert.throws(()=>decodeSaveBackup(encodeSaveBackup([{key:'C:\\DEFAULT.EXE',bytes:new Uint8Array(364)}],'C:\\')),/unsupported game file/);
});
