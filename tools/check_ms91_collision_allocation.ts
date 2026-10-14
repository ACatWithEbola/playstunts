import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {versionedRouteTables} from '../lib/game/versioned-route-tables.ts';
import {analyzeRoute} from '../lib/physics/route-analysis.ts';

// Read-only allocation-content oracle; this does not certify runtime impacts.
const [image,libraries,game,...replays]=process.argv.slice(2);
assert.ok(image&&libraries&&game&&replays.length);
const data=versionedRouteTables({...fixtureData,physicsEngine:'ms-1991' as const});
for(const replay of replays){
 const before=readFileSync(replay);
 const run=spawnSync('python3',['tools/check_original_ms91_track_allocation.py',image,'--libraries',libraries,'--replay',replay,'--game',game,'--analyze'],{encoding:'utf8',maxBuffer:12000000});
 assert.equal(run.status,0,run.stderr);
 const original=JSON.parse(run.stdout).trackAnalysis.collisionAllocation;
 const raw=Array.from(before.subarray(26,1828));
 const native=analyzeRoute(raw,data.records,data.vectors,data.samples,data.objects,undefined,{sample:false});
 assert.ok(native.metadata,'Native metadata must be populated');
 assert.deepEqual(original.tileIndices.slice(0,900),native.metadata.cells,'Collision tile lookup '+replay);
 assert.deepEqual(original.centres,native.metadata.positions,'Indexed collision centres '+replay);
 assert.deepEqual(original.initialProcessedMarkers,Array(native.metadata.positions.length).fill(0),'Fresh original markers');
 assert.deepEqual(readFileSync(replay),before,'Source replay unchanged');
 console.log(JSON.stringify({replay,tilesCompared:900,centresCompared:original.centres.length,sourceUnchanged:true,pass:true,runtimeImpactsVerified:false}));
}
