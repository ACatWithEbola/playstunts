import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {repositionWallWheels} from '../lib/physics/wall-response.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,512);
for(const [index,row] of rows.entries())assert.deepEqual(repositionWallWheels(row.proposed,row.origins,row.approach,row.scaled,row.offset),row.result,`Original wheel reposition ${index}`);
console.log('512 original modern four-wheel reposition outputs match the native production helper,including zero approach and signed offsets');
