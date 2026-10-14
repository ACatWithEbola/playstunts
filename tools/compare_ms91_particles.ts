import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateParticles,advanceParticles,type Particles} from '../lib/game/particles.ts';
const path=process.argv[2];if(!path)throw Error('Usage: node tools/compare_ms91_particles.ts ORIGINAL_CAPTURE.json');
const rows=JSON.parse(readFileSync(path,'utf8')) as {owner:number;yaw:number;speed:number;rate:10|20;height:number;before:Particles;result:Particles}[];
assert.equal(rows.length,400);let legacyDifferences=0;
for(const [index,row] of rows.entries()){
 const before=structuredClone(row.before);
 if(process.argv.includes('--advance')){
  assert.deepEqual(advanceParticles(row.before,row.height,row.rate),row.result,'Original MS91 debris movement '+index);
  assert.deepEqual(row.before,before);continue;
 }
 assert.deepEqual(generateParticles(row.before,row.owner,row.yaw,row.speed,'ms-1991'),row.result,'Original MS91 debris case '+index);
 assert.deepEqual(generateParticles(row.before,row.owner,row.yaw,row.speed),generateParticles(row.before,row.owner,row.yaw,row.speed,'ms-1990'));
 if(JSON.stringify(generateParticles(row.before,row.owner,row.yaw,row.speed))!==JSON.stringify(row.result))legacyDifferences++;
 assert.deepEqual(row.before,before);
}
if(!process.argv.includes('--advance'))assert.ok(legacyDifferences>0);
console.log('400 original MS91 debris '+(process.argv.includes('--advance')?'movement':'generation')+' cases match; legacy generation differences '+legacyDifferences);
