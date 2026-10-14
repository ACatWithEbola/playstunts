import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
import {encodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {preparePrivateReplayUpload} from '../lib/game/replay-upload.ts';
import {replayVideoSettings} from '../lib/game/future-race-settings.ts';
import {createNativeFileStore,type NativeStoredFile} from '../lib/game/native-file-store.ts';
import {nativeFileDownload} from '../lib/game/native-file-download.ts';
import {encodeSaveBackup,decodeSaveBackup} from '../lib/game/save-backup.ts';
import {createNativeReplayRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
const bundled=versionedDemoResource('ms-1991')!,expected=encodeVersionedReplay(bundled.bytes,bundled.physicsEngine,bundled.framesPerSecond);
// Optional evidence from the ordinary browser download, not a regenerated
// export. Require the known fixture identity before using its recorded finish.
const external=process.argv[2]?new Uint8Array(readFileSync(process.argv[2])):expected;
assert.deepEqual(external,expected,'Browser export must retain the original known slow replay');
const before=external.slice();
const oldBytes=new Uint8Array(readFileSync('public/game/replays/CTKFIN.RPL'));
const legacy:NativeStoredFile={key:'C:\\OLD.RPL',bytes:oldBytes},score:NativeStoredFile={key:'C:\\DEFAULT.HIG',bytes:new Uint8Array(364).fill(17)};
const stored=preparePrivateReplayUpload('QA_SLOW.RPL',external,'C:\\','ms-1991');
const files=new Map([legacy,score,stored].map(file=>[file.key,structuredClone(file)])),originalFiles=structuredClone([...files.values()]);
const persistence={async all(){return structuredClone([...files.values()]);},async put(file:NativeStoredFile){files.set(file.key,structuredClone(file));}};
const drive=await createNativeFileStore(new Map(),persistence);
assert.equal(drive.physicsEngine('C:\\','QA_SLOW','.rpl'),'ms-1991');assert.equal(drive.framesPerSecond('C:\\','QA_SLOW','.rpl'),10);
const backup=decodeSaveBackup(encodeSaveBackup(await persistence.all(),'C:\\'));
assert.deepEqual(backup.files,originalFiles);assert.deepEqual(nativeFileDownload(backup.files.find(f=>f.key===stored.key)!),external);
const reopened=await createNativeFileStore(new Map(),{async all(){return structuredClone(backup.files);},async put(){throw Error('Replay loading must not write private storage');}});
const bytes=await reopened.read('C:\\','QA_SLOW','.rpl'),recording={bytes,name:'QA_SLOW',path:'C:\\',physicsEngine:reopened.physicsEngine('C:\\','QA_SLOW','.rpl'),framesPerSecond:reopened.framesPerSecond('C:\\','QA_SLOW','.rpl')};
const futureData={...fixtureData,physicsEngine:'ms-1990' as const,framesPerSecond:20 as const};
const futureKeys=Object.keys(futureData);
const runtime=await createNativeReplayRaceRuntime(replayVideoSettings(futureData),{configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'DEFAULT',camera:0,graphics:2,soundEnabled:false},recording,{resetMouse(){},async key(){return 27;}});
assert.equal(runtime.session.physicsEngine,'ms-1991');assert.equal(runtime.session.framesPerSecond,10);runtime.session.seek(958);runtime.renderCockpitWorld();assert.equal(runtime.session.state.player.driving.car.grip.crash,3);
assert.equal(runtime.session.state.memory[0x2d1a0+0x8018]&1,0);
// Presentation changes after loading must not become a replay conversion or
// modify its private persistence metadata, even under a different future rate.
const control=await createNativeReplayRaceRuntime(replayVideoSettings(futureData),{configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'DEFAULT',camera:0,graphics:2,soundEnabled:false},recording,{resetMouse(){},async key(){return 27;}});
for(const slow of [true,false,true]){
 runtime.setMs91VideoManagement(slow);
 for(const frame of [0,100,600,958]){
  for(const next of [runtime,control]){next.session.seek(0);next.session.seek(frame);}
  assert.deepEqual(runtime.renderCockpitWorld(),control.renderCockpitWorld(),'Imported replay remains faithful after video setting change at '+frame);
  assert.deepEqual(runtime.session.state.memory,control.session.state.memory);
  assert.equal(runtime.session.physicsEngine,'ms-1991');assert.equal(runtime.session.framesPerSecond,10);
 }
 assert.deepEqual(nativeFileDownload(files.get(stored.key)!),external,'Download bytes remain original after presentation changes');
}
assert.deepEqual([...files.values()],originalFiles);assert.deepEqual(external,before);assert.deepEqual(await reopened.read('C:\\','OLD','.rpl'),oldBytes);assert.deepEqual(await reopened.read('C:\\','DEFAULT','.hig'),score.bytes);
assert.deepEqual(Object.keys(futureData),futureKeys);assert.equal(futureData.physicsEngine,'ms-1990');assert.equal(futureData.framesPerSecond,20);
console.log('Original MS9110Hz replay imports, privately persists, backs up, downloads exact original bytes and reloads to finish; legacy replay/score preserved, no score eligibility gained');
