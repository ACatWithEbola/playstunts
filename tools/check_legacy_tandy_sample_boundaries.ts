import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runOriginalTandySampleStart,completeOriginalTandySample} from '../lib/game/tandy-sample.ts';
const path=process.argv[2];if(!path)throw Error('Supply original legacy sample boundary corpus');
const rows=JSON.parse(readFileSync(path,'utf8'));let boundaries=0;
for(const row of rows){
 const driver=Uint8Array.from(Buffer.from(row.before,'base64')),program=runOriginalTandySampleStart(driver,0x2000,0,row.sample,row.rate,row.repeats,true);
 let step=program.next(),index=0;
 while(!step.done){
  assert.deepEqual(Buffer.from(driver),Buffer.from(row.boundaries[index],'base64'),'Full driver state at exact BIOS call');
  assert.deepEqual(step.value.bios,[row.bios[index]]);
  if(index===0&&row.active===1)assert.deepEqual(completeOriginalTandySample(driver,0x91fb).bios,row.completionBios);
  index++;boundaries++;step=program.next(driver);
 }
 assert.equal(index,row.bios.length);assert.deepEqual(step.value.bios,row.bios);assert.deepEqual(Buffer.from(driver),Buffer.from(row.after,'base64'));
}
console.log(`${rows.length} original legacy sample-start cases match ${boundaries} exact BIOS boundary states, requests and final driver bytes`);
