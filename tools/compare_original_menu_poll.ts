import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pollOriginalInput} from '../lib/game/poll-original-input.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));
assert.equal(rows.length,256);
for(const [index,row] of rows.entries()){
 const memory=new Uint8Array(0x100000),d=0x60000,v=new DataView(memory.buffer);
 for(const [at,value] of Object.entries(row.initial))v.setUint16(d+Number(at),Number(value),true);
 for(const [at,value] of Object.entries(row.flags))memory[d+Number(at)]=Number(value);
 const result=pollOriginalInput(memory,d,row.delta,row.sample);
 assert.equal(result.key,row.key,`key case ${index}`);assert.deepEqual(result.effects,row.effects,`cursor events case ${index}`);
 // Host cursor raster services update visibility after the emitted events.
 for(const effect of result.effects)memory[d+0x133]=Number(effect==='showCursor');
 for(const [at,value] of Object.entries(row.after))assert.equal(v.getUint16(d+Number(at),true),value,`field ${at} case ${index}`);
 for(const [at,value] of Object.entries(row.afterFlags))assert.equal(memory[d+Number(at)],value,`flag ${at} case ${index}`);
}
console.log('PASS: 256 actual original menu polling cases match native keys, retained fields and cursor events');
