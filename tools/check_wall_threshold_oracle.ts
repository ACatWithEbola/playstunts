import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {wallCrashThreshold,wallImpactDecision} from '../lib/physics/wall-response.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,1024);
for(const row of rows){
 assert.equal(wallCrashThreshold(row.impact,'ms-1990'),row.legacy);
 assert.equal(wallCrashThreshold(row.impact,'ms-1991'),row.modern);
 assert.equal(wallCrashThreshold(row.impact),row.legacy);
 if(row.decisions)assert.equal(row.decisions.length,6);
 for(const decision of row.decisions??[])assert.deepEqual(wallImpactDecision(row.impact,row.direction>256,decision.speed,123,decision.generation),{crash:decision.crash,wheelAngle:decision.wheelAngle});
}
console.log('1024 paired original wall thresholds match both native generation routes and preserved legacy default');
if(rows[0].decisions)console.log('6144 original wall crash boundary decisions and wheel-angle changes match native production helper');
