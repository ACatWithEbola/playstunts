import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {addOriginalTimerCallback} from '../lib/game/add-timer-callback.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,10);
for(const row of rows){const memory=new Uint8Array(65536);memory.set(row.before,0x4092);addOriginalTimerCallback(memory,0,0x1234,0x5678);assert.deepEqual(Array.from(memory.subarray(0x4092,0x4092+24)),row.after,`${row.engine}/${row.occupied}`);}
console.log('Native callback registration matches complete original table mutations in both editions under explicit table relocation');
