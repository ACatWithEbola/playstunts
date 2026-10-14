import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {carsOverlap} from '../lib/physics/car-overlap.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,1000);let hits=0;
for(const [index,row] of rows.entries()){
 const actual=carsOverlap({position:[row.x,row.height,row.z],angles:row.angles,dimensions:row.dimensions,radius:row.radius},{position:[0,0,0],angles:row.targetAngles,dimensions:row.targetDimensions,radius:row.targetRadius});
 assert.equal(actual,row.hit,'Original two-rotated-car overlap case'+index);hits+=Number(actual);
}
assert.ok(hits>0&&hits<rows.length);console.log('PASS1000 paired rotated car overlaps; hits='+hits);
