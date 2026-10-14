import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {startMs91TandySample} from '../lib/game/ms91-tandy-sample-start.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,512);
for(const [index,row] of rows.entries()){
 const memory=new Uint8Array(0x100000),before=Uint8Array.from(Buffer.from(row.before,'base64'));
 memory.set(before,0x20000);memory.set(row.sample,0x30100);memory.set(row.vectorBefore,0x20);
 const result=startMs91TandySample(memory,0x2000,row.request);
 assert.deepEqual(memory.slice(0x20000,0x20000+before.length),Uint8Array.from(Buffer.from(row.after,'base64')),`driver ${index}`);
 assert.deepEqual([...memory.slice(0x20,0x24)],row.vectorAfter,`vector ${index}`);assert.deepEqual(result.writes,row.writes,`ports ${index}`);
 assert.deepEqual([...memory.slice(0x30100,0x30180)],row.sample);
}
console.log('512 original TD15 sample starts match complete driver state,frequency clamps,raw/differential buffer setup,zero length,repeats,IVT and ordered timer/PIC/DAC writes');
