import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stepOriginalPcSpeakerSample} from '../lib/game/pc-speaker-sample.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,2000);let chains=0,restores=0;
for(const [index,row] of rows.entries()){
 const driver=Uint8Array.from(Buffer.from(row.before,'base64')),result=stepOriginalPcSpeakerSample(driver,row.port61,(offset,segment)=>{assert.equal(segment,0x7000);return (offset*7+19)&255;},row.engine);
 assert.deepEqual(result.writes,row.writes,'ports'+index);assert.deepEqual(driver,Uint8Array.from(Buffer.from(row.after,'base64')),'driver'+index);
 assert.equal(!!result.chainVector,row.chain);assert.deepEqual(result.restoreVector?[result.restoreVector.offset,result.restoreVector.segment]:[0x3344,0x1122],row.vector);
 chains+=Number(!!result.chainVector);restores+=Number(!!result.restoreVector);
}
assert.ok(chains&&restores);console.log('PASS2000 original sample IRQ cases; chains='+chains+', restores='+restores);
