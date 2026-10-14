import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {intersectZ} from '../lib/physics/intersection.ts';
import type {Vector} from '../lib/physics/math.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8')) as {first:Vector;second:Vector;result:Vector}[];
for(const [index,row] of rows.entries())assert.deepEqual(intersectZ(row.first,row.second,0),row.result,'Original MS91 crossing mismatch at '+index);
console.log('Intersection matches '+rows.length+' original MS91 crossing outputs');
