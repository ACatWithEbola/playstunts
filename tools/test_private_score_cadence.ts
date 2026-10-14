import assert from 'node:assert/strict';
import {createNativeFileStore,type NativeStoredFile} from '../lib/game/native-file-store.ts';
import {createGlobalScoreFileStore} from '../lib/game/global-score-file-store.ts';
import {sharedScoreFile} from '../lib/game/global-score-format.ts';
import {encodeSaveBackup,decodeSaveBackup} from '../lib/game/save-backup.ts';
import type {PhysicsEngineVersion} from '../lib/physics/engine-version.ts';
import type {ReplayCadence} from '../lib/game/replay-cadence.ts';
const saved=new Map<string,NativeStoredFile>();
const persistence={async all(){return structuredClone([...saved.values()]);},async put(file:NativeStoredFile){saved.set(file.key,structuredClone(file));}};
const local=await createNativeFileStore(new Map(),persistence);
await local.write('C:\\','TEST','.TRK',new Uint8Array(1802));
const table=(ticks:number)=>{const record=Array(52).fill(0);record[0]=65;record[50]=ticks&255;record[51]=ticks>>>8;return sharedScoreFile([record]);};
let engine:PhysicsEngineVersion='ms-1990',cadence:ReplayCadence=20,retainedReads=0;
const shared={async retainedRecords(){retainedReads++;return [];},close(){}} as unknown as Parameters<typeof createGlobalScoreFileStore>[1];
const files=createGlobalScoreFileStore(local,shared,()=>undefined,()=>engine,()=>cadence);
const cases:[PhysicsEngineVersion,ReplayCadence,string,number][]=[['ms-1990',20,'HIG',2000],['ms-1991',20,'M91',1800],['ms-1991',10,'M10',950],['bb-1991',20,'B91',1900],['bb-1991',10,'B10',1000]];
for(const [e,rate,extension,ticks] of cases){
 engine=e;cadence=rate;await files.write('C:\\','TEST','.HIG',table(ticks));
 assert.deepEqual(await local.read('C:\\','TEST','.'+extension),table(ticks));
 assert.equal(local.framesPerSecond('C:\\','TEST','.'+extension),rate);
}
const snapshot=await persistence.all();
for(const [e,rate,,ticks] of cases){
 engine=e;cadence=rate;const calls=retainedReads;
 assert.deepEqual(await files.read('C:\\','TEST','.HIG'),table(ticks));
 assert.equal(retainedReads-calls,rate===20?1:0);
}
assert.deepEqual(await persistence.all(),snapshot,'Reading isolated tables does not rewrite existing files');
const backup=decodeSaveBackup(encodeSaveBackup(snapshot,'C:\\'));
const reopened=await createNativeFileStore(new Map(),{async all(){return backup.files;},async put(){throw Error('Restore must not rewrite');}});
const restored=createGlobalScoreFileStore(reopened,shared,()=>undefined,()=>engine,()=>cadence);
for(const [e,rate,,ticks] of cases){engine=e;cadence=rate;assert.deepEqual(await restored.read('C:\\','TEST','.HIG'),table(ticks));}
engine='ms-1990';cadence=10;
await assert.rejects(files.write('C:\\','TEST','.HIG',table(1)),/Legacy scores require20/);
assert.deepEqual(await persistence.all(),snapshot);
for(const [e,rate,extension] of cases)for(const length of [0,51,363,365]){
 const damaged=structuredClone(snapshot);
 const target=damaged.find(file=>file.key.toUpperCase().endsWith('TEST.'+extension))!;
 target.bytes=new Uint8Array(length).fill(17);
 const retained=structuredClone(damaged);
 let writes=0,proofReads=0;
 const damagedLocal=await createNativeFileStore(new Map(),{async all(){return structuredClone(damaged);},async put(){writes++;}});
 const damagedShared={async retainedRecords(){proofReads++;return [];},close(){}} as unknown as Parameters<typeof createGlobalScoreFileStore>[1];
 const damagedFiles=createGlobalScoreFileStore(damagedLocal,damagedShared,()=>undefined,()=>e,()=>rate);
 await assert.rejects(damagedFiles.read('C:\\','TEST','.HIG'),/Invalid private score table/);
 assert.equal(writes,0,'A read must not repair damaged private evidence');
 assert.equal(proofReads,0,'Reject damaged tables before proof recovery');
 assert.deepEqual(await damagedLocal.read('C:\\','TEST','.'+extension),target.bytes);
 for(const [siblingEngine,siblingRate,siblingExtension,siblingTicks] of cases){
  assert.deepEqual(await damagedLocal.read('C:\\','TEST','.'+siblingExtension),siblingExtension===extension?target.bytes:table(siblingTicks));
  assert.equal(damagedLocal.physicsEngine('C:\\','TEST','.'+siblingExtension),siblingEngine);
  assert.equal(damagedLocal.framesPerSecond('C:\\','TEST','.'+siblingExtension),siblingRate);
 }
 assert.deepEqual(damaged,retained,'Preserve every namespace and its metadata');
}
console.log('Legacy and modern10/20 Hz private scores stay separate across read, write, backup and reopen;10 Hz never restores20 Hz proofs');
