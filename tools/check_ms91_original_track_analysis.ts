/** Compare original MS91 track analysis against prepared web route. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {isAbsolute} from 'node:path';
import {fixtureData} from './global-score-fixture.ts';
import {prepareRaceTrack} from '../lib/game/prepare-race-track.ts';
import {versionedRouteTables} from '../lib/game/versioned-route-tables.ts';
const [image,libraries,replay]=process.argv.slice(2);
assert.ok([image,libraries,replay].every(x=>x&&isAbsolute(x)));
const source=readFileSync(replay);
const run=spawnSync('python3',[new URL('./check_original_ms91_track_allocation.py',import.meta.url).pathname,image,'--libraries',libraries,'--replay',replay,'--analyze'],{encoding:'utf8',maxBuffer:2*1024*1024});
assert.equal(run.status,0,run.stderr);
const captured=JSON.parse(run.stdout).trackAnalysis.route;
const d=versionedRouteTables({...fixtureData,physicsEngine:'ms-1991' as const});
const prepared=prepareRaceTrack(Array.from(source.slice(26,1828)),d.records,d.vectors,d.samples,d.objects).route;
assert.ok(prepared.count>0&&prepared.count===prepared.tiles.length);
for(const [field,expected] of Object.entries({tiles:prepared.tiles,directions:prepared.directions,columns:prepared.columns,rows:prepared.routeRows})){
 assert.deepEqual(captured[field].slice(0,prepared.count),expected,field+' differs');
}
for(const [field,expected] of Object.entries({primary:prepared.primary,secondary:prepared.secondary})){
 assert.equal(captured[field].length,901);
 assert.deepEqual(captured[field].slice(0,expected.length),expected.map(n=>n&65535),field+' links differ');
 assert.ok(captured[field].slice(expected.length).every((n:number)=>n===65535),field+' unused links must remain unassigned');
}
assert.deepEqual(readFileSync(replay),source);
console.log(JSON.stringify({routeEntries:prepared.count,linkWords:1802,originalMS91:true,sourceUnchanged:true,pass:true}));
