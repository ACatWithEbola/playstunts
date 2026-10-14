import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {loadVleResource} from '../lib/game/load-vle-resource.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));
assert.ok(rows.length>0);
for(const row of rows){
 const packed=readFileSync(join(process.argv[3],row.name)),stage=packed.subarray(row.stageOffset);
 const result=loadVleResource(new Uint8Array((Math.ceil(row.size/16)+4)*16),0,stage);
 assert.equal(result.resource.length,row.size);
 assert.equal(createHash('sha256').update(result.resource).digest('hex'),row.sha256,row.name);
}
console.log(`PASS: ${rows.length} shipped type-2 stages match both original editions byte-for-byte by SHA-256`);
