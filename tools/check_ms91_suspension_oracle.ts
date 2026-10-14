import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stepSuspension,type SuspensionState} from '../lib/physics/suspension.ts';
import {resolvePhysicsEngine} from '../lib/physics/engine-version.ts';
const engine=resolvePhysicsEngine(process.argv[3]??'ms-1991');
const rows=JSON.parse(readFileSync(process.argv[2],'utf8')) as {before:SuspensionState;distance:number;after:SuspensionState&{height:number}}[];
for(const [index,row] of rows.entries()){
 assert.deepEqual(stepSuspension(row.before,row.distance,engine),row.after,'Original suspension mismatch at case '+index);
 if(engine==='ms-1990')assert.deepEqual(stepSuspension(row.before,row.distance),row.after,'Default suspension must stay legacy');
}
console.log('Reconstructed suspension matches '+rows.length+' original '+engine+' outputs');
