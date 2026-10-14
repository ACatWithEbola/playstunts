import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {restoreOriginalPcSpeakerSampleTimer} from '../lib/game/pc-speaker-sample.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,2000);
for(const [index,row] of rows.entries()){
 const driver=Uint8Array.from(Buffer.from(row.before,'base64')),result=restoreOriginalPcSpeakerSampleTimer(driver,row.engine);
 assert.deepEqual(result.writes,row.writes,'ports'+index);assert.deepEqual(driver,Uint8Array.from(Buffer.from(row.after,'base64')),'driver'+index);
 assert.deepEqual(result.restoreVector?[result.restoreVector.offset,result.restoreVector.segment]:[0x3344,0x1122],row.vector,'virtual vector'+index);
}
console.log('PASS2000 original sample timer restores, complete driver state, virtual ports and IRQ vector');
