import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stepSteering} from '../lib/physics/steering.ts';
const path=process.argv[2];if(!path)throw Error('Usage: node tools/compare_ms91_steering.ts ORIGINAL_CAPTURE.json');
const rows=JSON.parse(readFileSync(path,'utf8')) as {rate:10|20;angle:number;speed:number;input:0|1|2|3;result:number}[];
assert.equal(rows.length,process.argv.includes('--legal-grid')?126984:2952);
let valid=0,invalidDifferences=0;
for(const [index,row] of rows.entries()){
 const actual=stepSteering(row.angle,row.speed,row.input,row.rate);
 // The native routine clamps every output to [-240,240]. Out-of-range input
 // probes are diagnostic only; do not claim valid gameplay covers corrupt state.
 if(Math.abs(row.angle)>240){if(actual!==row.result)invalidDifferences++;continue;}
 valid++;assert.equal(actual,row.result,'Original MS91 valid steering case '+index+' '+JSON.stringify(row));
}
assert.ok(valid>=700);console.log(valid+' valid-range original MS91 steering cases match; '+invalidDifferences+' corrupt-range differences remain outside this proof');
