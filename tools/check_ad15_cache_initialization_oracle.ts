import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeMs91AdlibRegisterCache} from '../lib/game/versioned-adlib-register-writes.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,1);const row=rows[0];assert.equal(row.initialize,true);
const driver=Uint8Array.from(Buffer.from(row.before,'base64')),writes=initializeMs91AdlibRegisterCache(driver);
assert.equal(writes.length,255);
assert.deepEqual(writes.flatMap(([r,v])=>[[0x388,r],[0x389,v]]),row.writes.filter(([port]:number[])=>port===0x388||port===0x389));
assert.deepEqual(driver,Uint8Array.from(Buffer.from(row.after,'base64')));
console.log('Original AD15 initialization matches all255 OPL register writes and complete retained driver bytes; timing excluded');
