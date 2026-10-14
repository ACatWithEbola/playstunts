import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {beginOriginalPcSpeakerSample} from '../lib/game/pc-speaker-sample.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,2000);
for(const [index,row] of rows.entries()){
 const driver=Uint8Array.from(Buffer.from(row.before,'base64')),result=beginOriginalPcSpeakerSample(driver,row.options,row.engine);
 assert.deepEqual(result.writes,row.writes,'ports'+index);assert.deepEqual(driver,Uint8Array.from(Buffer.from(row.after,'base64')),'driver'+index);
 const vector=result.installVector??result.restoreVector??row.options.irqVector;assert.deepEqual([vector.offset,vector.segment],row.vector,'IRQ vector'+index);
}
console.log('PASS2000 original sample startups, complete driver bytes, virtual writes/vector including zero-end and replacement paths');
