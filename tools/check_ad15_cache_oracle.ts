import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {versionedAdlibRegisterWrites} from '../lib/game/versioned-adlib-register-writes.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,200);
for(const row of rows){
 const driver=Uint8Array.from(Buffer.from(row.before,'base64')),input=[[row.register,row.value]];
 const result=versionedAdlibRegisterWrites(driver,input,'ms-1991');
 assert.deepEqual(result.flatMap(([r,v])=>[[0x388,r],[0x389,v]]),row.writes.filter(([port]:number[])=>port===0x388||port===0x389));
 assert.deepEqual(driver,Uint8Array.from(Buffer.from(row.after,'base64')));
 const old=Uint8Array.from(Buffer.from(row.before,'base64')),saved=old.slice();assert.deepEqual(versionedAdlibRegisterWrites(old,input),input);assert.deepEqual(old,saved);
}
console.log('200 original AD15 emitted/skipped OPL writes and complete driver bytes match; legacy/default unchanged; physical timing excluded');
