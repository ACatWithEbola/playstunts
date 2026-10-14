import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {loadAllocatedPackedResource} from '../lib/game/load-allocated-packed-resource.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,55);
for(const row of rows){
 const memory=new Uint8Array(0x100000).fill(0xa5),d=0x60000,v=new DataView(memory.buffer),put=(at:number,value:number)=>v.setUint16(d+at,value,true);
 memory.fill(0,d,d+65536);memory.set(Buffer.from(row.name+'\0'),d+0x2000);
 put(0x4b12,0x1000);put(0x4b14,0x1000);put(0x4b16,0x1100);put(0x4b18,0x1100);
 put(0x100c,0);put(0x100e,0x3000);put(0x1010,1);put(0x110e,0xf000);
 const packed=readFileSync(join(process.argv[3],row.name)),before=memory.slice(),result=loadAllocatedPackedResource(memory,d,0x2000,packed),final=row.stages.at(-1);
 assert.equal(result.error,null,row.name);assert.ok(result.resource);
 assert.equal(result.segment,0x3000);assert.equal(result.resource.length,final.size);
 assert.equal(createHash('sha256').update(result.resource!).digest('hex'),final.sha256,row.name);
 const out=new DataView(result.memory.buffer);assert.equal(out.getUint16(d+0x4b14,true),0x1012);
 assert.equal(out.getUint16(d+0x101e,true),Math.ceil(final.size/16));
 assert.equal(out.getUint16(d+0x4788,true),0x3000+Math.ceil(final.size/16)+4);
 assert.deepEqual(memory,before,`caller memory ${row.name}`);
}
console.log(`PASS: all ${rows.length} shipped resources allocate, stage, decode and shrink to original final bytes; caller memory unchanged`);
