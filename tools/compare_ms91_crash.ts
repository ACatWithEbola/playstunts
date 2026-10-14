import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {updateCrashState,type CrashRaceState,type CrashEffect} from '../lib/game/crash-state.ts';
const path=process.argv[2];if(!path)throw Error('Usage: node tools/compare_ms91_crash.ts ORIGINAL_CAPTURE.json');
const rows=JSON.parse(readFileSync(path,'utf8')) as {rate:10|20;cause:1|2|3|4|5;car:0|1;before:CrashRaceState;result:CrashRaceState;effects:CrashEffect[]}[];
assert([1000,2000].includes(rows.length));
if(rows.length===1000)assert(rows.every(row=>row.rate===20),'Legacy corpus must retain fixed20Hz timers');
const causeCounts=new Map<number,number>();
for(const [index,row] of rows.entries()){
 causeCounts.set(row.cause,(causeCounts.get(row.cause)??0)+1);
 const before=structuredClone(row.before),actual=updateCrashState(row.before,row.cause,row.car,row.rate);
 assert.deepEqual(actual.state,row.result,'Original MS91 crash state case '+index);
 assert.deepEqual(actual.effects,row.effects,'Original side-effect requests '+index);assert.deepEqual(row.before,before);
}
for(const cause of [1,2,3,4,5])assert.equal(causeCounts.get(cause),rows.length/5,'Each cause must cover both cars and supplied cadences');
console.log(`All${rows.length} original ${rows.length===1000?'MS90':'MS91'} crash state and particle/audio request comparisons pass`);
console.log(`Includes${causeCounts.get(5)} underside event5 cases across both cars; effects are compared requests,not rendered particles or audible output`);
