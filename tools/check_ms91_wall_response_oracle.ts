import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {wallResponse} from '../lib/physics/wall-response.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,512);
for(const [index,row] of rows.entries()){const {expected,...input}=row;assert.equal(input.physicsEngine,'ms-1991');assert.deepEqual(wallResponse(input),expected,`Original full modern wall response ${index}`);}
console.log('512 complete original MS91 wall response outputs match native entry,geometry,crash decision and four-wheel repositioning');
