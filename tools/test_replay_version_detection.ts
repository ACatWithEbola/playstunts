import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {detectReplayVersions} from '../lib/game/replay-version-detection.ts';
import {encodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
const legacy=new Uint8Array(readFileSync(new URL('../public/game/replays/CTKFIN.RPL',import.meta.url))),snapshot=legacy.slice();
assert.deepEqual(detectReplayVersions(legacy),['ms-1990']);
for(const engine of ['ms-1991','bb-1991'] as const){
 const modern=encodeVersionedReplay(legacy,engine,20),before=modern.slice();
 assert.deepEqual(detectReplayVersions(modern),['ms-1991','bb-1991']);
 assert.deepEqual(modern,before);
 const wrapped=new Uint8Array(modern.length+17);wrapped.fill(255);wrapped.set(modern,9);
 const wrappedBefore=wrapped.slice();assert.deepEqual(detectReplayVersions(wrapped.subarray(9,9+modern.length)),['ms-1991','bb-1991']);assert.deepEqual(wrapped,wrappedBefore,'Detection must respect byte offset and leave surrounding data unchanged');
 for(const rate of [0,1,15,30,256,65535]){
  const malformed=modern.slice();new DataView(malformed.buffer).setUint16(22,rate,true);const malformedBefore=malformed.slice();
  assert.deepEqual(detectReplayVersions(malformed),[],'Unsupported recorded cadence must not be identified as another edition');assert.deepEqual(malformed,malformedBefore);
 }
 assert.deepEqual(detectReplayVersions(modern.subarray(0,modern.length-1)),[]);
}
assert.deepEqual(detectReplayVersions(new Uint8Array(1802)),[]);
assert.deepEqual(detectReplayVersions(encodeVersionedReplay(legacy,'ms-1991',10)),['ms-1991','bb-1991']);
assert.deepEqual(legacy,snapshot);
for(const count of [0,1,12000,12001,65535]){
 const canonical=new Uint8Array(0x722+count);canonical.set(legacy.subarray(0,0x722));new DataView(canonical.buffer).setUint16(22,count,true);
 const before=canonical.slice(),supported=count>=1&&count<=12000;
 assert.deepEqual(detectReplayVersions(canonical),supported?['ms-1990']:[],'Legacy frame boundary '+count);
 for(const rate of [10,20] as const){
  const external=encodeVersionedReplay(canonical,'ms-1991',rate),externalBefore=external.slice();
  assert.deepEqual(detectReplayVersions(external),supported?['ms-1991','bb-1991']:[],'Modern frame boundary '+count+' at '+rate+'Hz must retain publisher ambiguity');
  assert.deepEqual(external,externalBefore);
 }
 assert.deepEqual(canonical,before,'Detection must not trim or rewrite an out-of-policy recording');
}
const uploadPanel=readFileSync(new URL('../app/SaveBackupPanel.tsx',import.meta.url),'utf8');
assert.match(uploadPanel,/const candidates=detectReplayVersions/);
assert.match(uploadPanel,/candidates.length===1\)\{await uploadReplay\(file,candidates\[0\]\);return;/);
assert.match(uploadPanel,/setImportCandidates\(candidates\);setImportEngine\(candidates\[0\]\);importDialog.current\?\.showModal/);
assert.match(uploadPanel,/importCandidates.map\(engine=>/);
assert.match(uploadPanel,/file&&importCandidates.includes\(importEngine\)/);
console.log('Replay layout detection preserves publisher ambiguity and source bytes');
