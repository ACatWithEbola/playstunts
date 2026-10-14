import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stepMs91TandySampleIrq} from '../lib/game/ms91-tandy-sample-irq.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,512);
for(const [index,row] of rows.entries()){
 const memory=new Uint8Array(0x100000),before=Uint8Array.from(Buffer.from(row.before,'base64'));
 memory.set(before,0x20000);memory.set(row.payload,0x30000);memory.set(row.vectorBefore,0x20);
 const actual=stepMs91TandySampleIrq(memory,0x2000,row.differential);
 assert.deepEqual(memory.slice(0x20000,0x20000+before.length),Uint8Array.from(Buffer.from(row.after,'base64')),`driver case ${index}`);
 assert.deepEqual([...memory.slice(0x20,0x24)],row.vectorAfter,`vector case ${index}`);
 assert.deepEqual(actual.writes,row.writes,`ports case ${index}`);assert.equal(actual.returnKind,row.returnKind);
 assert.deepEqual([...memory.slice(0x30000,0x30040)],row.payload,'source samples unchanged');
}
console.log('512 original raw/differential IRQ cases match complete driver state,buffer boundaries,repeats,timer/vector/PIC restoration,ordered ports and return/chaining');
