import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {loadAllocatedPackedResource} from '../lib/game/load-allocated-packed-resource.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,55);
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
for(const row of rows){
 const memory=new Uint8Array(0x100000).fill(0xa5),d=0x60000,v=new DataView(memory.buffer),put=(at:number,value:number)=>v.setUint16(d+at,value,true);
 memory.fill(0,d,d+65536);memory.set(Buffer.from(row.name+'\0'),d+0x2000);
 for(const [at,value] of [[0x4b12,0x1000],[0x4b14,0x1000],[0x4b16,0x1100],[0x4b18,0x1100],[0x4788,0x7000],[0x100c,0],[0x100e,0x7000],[0x1010,1],[0x110e,0xf000]])put(at,value);
 const result=loadAllocatedPackedResource(memory,d,0x2000,readFileSync(join(process.argv[3],row.name)));
 assert.equal(result.error,null,row.name);assert.equal(result.segment,0x7000);
 assert.equal(hash(result.resource!),row.finalSha256,`${row.name} final bytes`);
 assert.equal(hash(result.memory.subarray(0x70000,0x70000+row.allocatedBytes)),row.allocationSha256,`${row.name} retained staging allocation`);
 assert.equal(new DataView(result.memory.buffer).getUint16(d+0x101e,true),row.pages);
}
console.log(`PASS: ${rows.length} native whole allocations, final bytes and retained staging match both original loaders`);
