import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {decodeSaveBackup,encodeSaveBackup} from '../lib/game/save-backup.ts';
import {selectFutureRaceEngine} from '../lib/game/future-race-engine.ts';
import {resolvePhysicsEngine} from '../lib/physics/engine-version.ts';
import {resolveReplayCadence} from '../lib/game/replay-cadence.ts';
import {encodeVersionedReplay,decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeFileStore} from '../lib/game/native-file-store.ts';
import {nativeFileDownload} from '../lib/game/native-file-download.ts';

// Read-only audit of a real exported private backup. No database or browser
// writes, restoration, simulation, or production-default changes are performed.
const path=process.argv[2];assert.ok(path,'Provide an exported backup path');
const original=readFileSync(path,'utf8'),backup=decodeSaveBackup(original);
const snapshot=structuredClone(backup),counts={legacy:0,modern:0,replays:0};
const identities=backup.files.map(file=>({key:file.key,engine:resolvePhysicsEngine(file.physicsEngine),rate:resolveReplayCadence(file.framesPerSecond)}));
for(const choice of ['ms-1991','ms-1990','ms-1991','ms-1990'] as const){
 assert.equal(selectFutureRaceEngine(choice),choice);
 const restored=decodeSaveBackup(encodeSaveBackup(backup.files,backup.directory));
 assert.deepEqual(restored,snapshot,'Backup roundtrip must retain complete file objects and directory');
 assert.deepEqual(restored.files.map(file=>({key:file.key,engine:resolvePhysicsEngine(file.physicsEngine),rate:resolveReplayCadence(file.framesPerSecond)})),identities,'Launch selection cannot override stored identities');
 let closed=false;
 const drive=await createNativeFileStore(new Map(),{async all(){return structuredClone(restored.files);},async put(){assert.fail('Reopening/exporting must not write private storage');},close(){closed=true;}});
 try{
  for(const file of restored.files){
   const slash=file.key.lastIndexOf('\\'),dot=file.key.lastIndexOf('.');
   assert.ok(dot>slash,'Audited backup contains ordinary game files');
   const directory=file.key.slice(0,slash+1),name=file.key.slice(slash+1,dot),extension=file.key.slice(dot);
   const read=await drive.read(directory,name,extension);
   assert.deepEqual(read,file.bytes,'Actual file store reopens all bytes');
   assert.equal(drive.physicsEngine(directory,name,extension),resolvePhysicsEngine(file.physicsEngine));
   assert.equal(drive.framesPerSecond(directory,name,extension),resolveReplayCadence(file.framesPerSecond));
   if(extension==='.RPL')assert.deepEqual(nativeFileDownload({...file,bytes:read}),encodeVersionedReplay(file.bytes,resolvePhysicsEngine(file.physicsEngine),resolveReplayCadence(file.framesPerSecond)));
   // Callers receive independent buffers, never the immutable storage copy.
   if(read.length)read[0]^=255;
   assert.deepEqual(await drive.read(directory,name,extension),file.bytes);
  }
 }finally{drive.close();}
 assert.equal(closed,true,'Reopened store must release its persistence connection');
 for(const file of restored.files.filter(file=>file.key.endsWith('.RPL'))){
  const engine=resolvePhysicsEngine(file.physicsEngine),rate=resolveReplayCadence(file.framesPerSecond);
  const canonicalBefore=file.bytes.slice();
  const decoded=decodeVersionedReplay(encodeVersionedReplay(file.bytes,engine,rate),engine);
  assert.deepEqual(decoded.bytes,canonicalBefore,'Download-format roundtrip must retain every canonical replay byte');
  assert.equal(decoded.framesPerSecond,rate);
  assert.deepEqual(file.bytes,canonicalBefore,'Export must not mutate stored recording');
 }
 assert.deepEqual(backup,snapshot);
}
for(const file of backup.files.filter(file=>file.key.endsWith('.RPL'))){counts.replays++;if(resolvePhysicsEngine(file.physicsEngine)==='ms-1990')counts.legacy++;else counts.modern++;}
assert.equal(readFileSync(path,'utf8'),original,'Source export must stay unchanged');
console.log(JSON.stringify({files:backup.files.length,...counts,sourceSha256:createHash('sha256').update(original).digest('hex'),passed:'private backup serialization, actual file-store reopen/copy ownership, native downloads and identity retention',notVerified:'live rollback, IndexedDB restore, full production inventory'}));
