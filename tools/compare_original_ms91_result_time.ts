import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ms91GameTime} from '../lib/game/game-time-format.ts';
import {writeMs91ResultTimeFields} from '../lib/game/race-result-time-scratch.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,4052);
let retained=0;
for(const row of rows){
 assert.equal(ms91GameTime(row.ticks,row.fractions,row.rate),row.text);
 if(row.fractions){
  const memory=new Uint8Array(65536),view=new DataView(memory.buffer);
  writeMs91ResultTimeFields(memory,0,row.resultFrameBP,row.ticks,row.rate);
  assert.equal(row.retained.length,6);
  for(const field of row.retained){assert.equal(view.getUint16((row.resultFrameBP+field.delta)&65535,true),field.value);retained++;}
 }
}
console.log(JSON.stringify({originalTimeCases:rows.length,retainedWordsCompared:retained,textAndRetainedFieldsMatch:true,pass:true}));
