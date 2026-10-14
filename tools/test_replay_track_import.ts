import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preparePrivateReplayUpload} from '../lib/game/replay-upload.ts';
import {replayTrackImport} from '../lib/game/replay-track-import.ts';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
import {encodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {ORIGINAL_STARTER_TRACKS} from '../lib/game/original-starter-tracks.ts';
const legacy=new Uint8Array(readFileSync('public/game/replays/CTKFIN.RPL'));
const modern=versionedDemoResource('ms-1991')!;
for(const [engine,external] of [['ms-1990',legacy],['ms-1991',encodeVersionedReplay(modern.bytes,'ms-1991',10)]] as const){
 const replay=preparePrivateReplayUpload('COPY.RPL',external,'C:\\',engine),before=replay.bytes.slice();
 const plan=replayTrackImport(replay);assert.equal(plan.status,'missing');
 assert.ok('track' in plan);assert.equal(plan.track.bytes.length,1802);assert.deepEqual(plan.track.bytes,replay.bytes.slice(24,0x722));
 assert.equal(replayTrackImport(replay,plan.track.bytes).status,'present');
 const conflict=plan.track.bytes.slice();conflict[0]^=1;const conflictBefore=conflict.slice();
 assert.equal(replayTrackImport(replay,conflict).status,'conflict');assert.deepEqual(conflict,conflictBefore);
 plan.track.bytes[0]^=1;assert.deepEqual(replay.bytes,before,'Extracted track is isolated from recording');
 for(const name of ['', '../TRACK','A:B','A\\B','A/B','LONGNAME9','A.B','A B']){
  const invalid:typeof replay={...replay,bytes:replay.bytes.slice()};invalid.bytes.fill(0,13,22);invalid.bytes.set(Buffer.from(name),13);
  assert.equal(replayTrackImport(invalid).status,'unsupported-name',name);
 }
}
const standard=Uint8Array.from(ORIGINAL_STARTER_TRACKS.find(track=>track.name==='DEFAULT')!.raw),standardBefore=standard.slice();
const canonical=modern.bytes.slice();canonical.fill(0,13,22);canonical.set(Buffer.from('DEFAULT'),13);canonical.set(standard,24);canonical[24]^=1;
const changedDefault=preparePrivateReplayUpload('QA_DFLT.RPL',encodeVersionedReplay(canonical,'ms-1991',10),'C:\\','ms-1991');
assert.equal(replayTrackImport(changedDefault,standard).status,'conflict');assert.deepEqual(standard,standardBefore);
const personal=standard.slice();personal[1]^=1;const personalBefore=personal.slice();
assert.equal(replayTrackImport(changedDefault,personal).status,'conflict');assert.deepEqual(personal,personalBefore);
console.log('Legacy and MS91 slow replay tracks extract exact1802 bytes, preserve replay identity/bytes, and distinguish existing matches, collisions and unsupported names');
