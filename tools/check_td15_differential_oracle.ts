import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stepMs91TandyDifferentialSample} from '../lib/game/ms91-tandy-differential-sample.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));
assert.equal(rows.length,2000);
for(const [index,row] of rows.entries()){
 const actual=stepMs91TandyDifferentialSample(row.before,row.sample);
 assert.deepEqual(actual,{state:row.after,consumed:row.consumed,writes:row.writes},`original TD15 case ${index}`);
}
console.log('2000 original TD15 differential IRQ cases match phase, accumulator, retained byte, pointer advancement and C5 writes');
