import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {findOriginalResource} from '../lib/game/find-original-resource.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,24);
for(const row of rows){
 const memory=new Uint8Array(0x100000),d=0x60000,bank=Buffer.from(row.bank,'hex');memory.set(bank,0x90000);memory.set(row.key,d+0x5000);
 if(row.missing)assert.throws(()=>findOriginalResource(memory,d,row.offset,0x9000,0x5000,true),/Required original resource is missing/);
 else assert.deepEqual(findOriginalResource(memory,d,row.offset,0x9000,0x5000,true),row.pointer);
 assert.deepEqual(Array.from(memory.subarray(d+0x5000,d+0x5004)),row.paddedKey);
 assert.deepEqual(Buffer.from(memory.subarray(0x90000,0x90000+bank.length)),bank);
}
console.log(JSON.stringify({originalComparedLookups:rows.length,pointersPaddingAndRequiredFailureMatch:true,sourceBanksUnchanged:true,pass:true}));
