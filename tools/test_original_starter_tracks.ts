import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {ORIGINAL_STARTER_TRACKS} from '../lib/game/original-starter-tracks.ts';
import {bundledTrackReplays} from '../lib/game/bundled-track-replays.ts';
import {createNativeFileStore} from '../lib/game/native-file-store.ts';
import {prepareRaceTrack} from '../lib/game/prepare-race-track.ts';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {ms91DemoTrack} from '../lib/game/ms91-demo-track.ts';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
test('six authentic original tracks replace the custom starter catalogue and remain playable',async()=>{
 assert.deepEqual(ORIGINAL_STARTER_TRACKS.map(t=>t.name),['DEFAULT','BERNIES','CHERRIS','HELENS','JOES','SKIDS']);
 const files=bundledTrackReplays([{name:'CUSTOM',raw:[1]}],async()=>new Uint8Array(),[{name:'CUSTOM',file:'CUSTOM.RPL',bytes:1,sha256:''}]);
 assert.equal(files.size,7);assert.equal(files.has('C:\\CUSTOM.TRK'),false);
 for(const t of ORIGINAL_STARTER_TRACKS){
  assert.equal(t.raw.length,1802);assert.equal(createHash('sha256').update(Uint8Array.from(t.raw)).digest('hex'),t.sha256);
  assert.deepEqual(await files.get('C:\\'+t.name+'.TRK')!(),Uint8Array.from(t.raw));
  assert.doesNotThrow(()=>prepareRaceTrack(t.raw,fixtureData.records,fixtureData.vectors,fixtureData.samples,fixtureData.objects));
  const configuration=Array.from(readFileSync(new URL('../public/game/replays/CTKFIN.RPL',import.meta.url)).subarray(0,24));
  const race=await createNativeManualRaceSession(fixtureData,{configuration,track:t.raw,name:t.name,camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
  race.session.skipIntroduction();assert.ok(race.session.state.player.driving.car.pose.position.every(Number.isFinite),'Original race startup must succeed');
 }
 assert.equal(ORIGINAL_STARTER_TRACKS[0].sha256,'4111e30379c39020d10f30eef15b7e46aca87a7716e499cde2e89c7c545388fd');
 const saved={key:'C:\\PERSONAL.TRK',bytes:new Uint8Array([1,2,3])};
 const local=await createNativeFileStore(files,{all:async()=>[saved],put:async()=>{throw Error('No user data should be written');}});
 assert.ok(local.enumerate('C:\\','.trk').includes('PERSONAL.TRK'));assert.deepEqual(await local.read('C:\\','PERSONAL','.trk'),saved.bytes);
});
test('original MS91 demo track is copied exactly, playable in both engines, and personal overlays win',async()=>{
 const originalReplay=versionedDemoResource('ms-1991')!.bytes,before=originalReplay.slice(),track=ms91DemoTrack();
 assert.equal(track.name,'VANCOUVR');assert.equal(track.bytes.length,1802);
 assert.equal(createHash('sha256').update(track.bytes).digest('hex'),'3068c4fa59d826232dbfc11dd6e7d4aa1fc57d4a195862f09b1d7589e5857020');
 assert.deepEqual(track.bytes,originalReplay.slice(24,0x722));
 const files=bundledTrackReplays([],async()=>new Uint8Array(),[]),key='C:\\VANCOUVR.TRK';
 assert.deepEqual(await files.get(key)!(),track.bytes);
 const copy=await files.get(key)!();copy[0]^=1;assert.deepEqual(await files.get(key)!(),track.bytes,'Readers cannot mutate bundled track');
 for(const physicsEngine of ['ms-1990','ms-1991'] as const){
  const race=await createNativeManualRaceSession({...fixtureData,physicsEngine},{configuration:Array.from(originalReplay.slice(0,24)),track:Array.from(track.bytes),name:track.name,camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
  race.session.skipIntroduction();assert.ok(race.session.state.player.driving.car.pose.position.every(Number.isFinite));
 }
 const personal=track.bytes.slice();personal[0]^=1;
 const local=await createNativeFileStore(files,{all:async()=>[{key,bytes:personal}],put:async()=>assert.fail('Bundling must not write personal storage')});
 assert.deepEqual(await local.read('C:\\','VANCOUVR','.trk'),personal);
 assert.deepEqual(versionedDemoResource('ms-1991')!.bytes,before,'Source recording unchanged');
});
