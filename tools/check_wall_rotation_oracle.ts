import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rotateZXY} from '../lib/physics/rotation.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,512);
for(const [index,row] of rows.entries())assert.deepEqual(rotateZXY(row.roll,row.pitch,row.yaw),row.matrix,`Original initialized rotation ${index}`);
console.log('512 initialized original rotation matrices match native builder across cardinal/noncardinal yaw and retained-cache reuse');
