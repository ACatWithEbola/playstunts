import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {decodeOriginalPackedResource} from '../lib/game/decode-packed-resource.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));let stages=0;
assert.equal(rows.length,55);
for(const row of rows){
 const packed=readFileSync(join(process.argv[3],row.name)),result=decodeOriginalPackedResource(packed);
 assert.equal(result.stages.length,row.stages.length);
 result.stages.forEach((bytes,index)=>{assert.equal(bytes.length,row.stages[index].size);assert.equal(createHash('sha256').update(bytes).digest('hex'),row.stages[index].sha256,`${row.name} stage ${index}`);stages++;});
}
console.log(`PASS: ${rows.length} shipped resources, all ${stages} compression stages match both original editions by SHA-256`);
