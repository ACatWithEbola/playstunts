import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,300);
for(const row of rows){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer);
 v.setUint16(0x73b2,row.count,true);v.setUint16(0xa034,row.adjustment,true);v.setUint16(0x9c42,0x8000,true);
 const result=captureOriginalRaceInput(memory,0,0,row.rate,'ms-1991');
 assert.equal(result.action==='record',row.allowed,'Duration gate '+JSON.stringify(row));
 assert.equal(memory[0x8ff4],row.done);
 assert.deepEqual(row.events,row.allowed?[]:[{cause:4,car:0}]);
 if(!row.allowed){assert.equal(v.getUint16(0x8c1e,true),1);assert.equal(v.getUint16(0x8c20,true),1);}
}
console.log(JSON.stringify({originalLimitCases:rows.length,gateAndCause4Match:true,pass:true}));
