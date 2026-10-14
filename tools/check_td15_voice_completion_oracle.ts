import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runOriginalTandyVoiceUpdate} from '../lib/game/tandy-voice-update.ts';
import {completeOriginalTandySample} from '../lib/game/tandy-sample.ts';
const path=process.argv[2];if(!path)throw Error('Supply explicit original legacy completion corpus');
const rows=JSON.parse(readFileSync(path,'utf8'));let delivered=0;
for(const row of rows){
 assert.equal(row.legacy,true);assert.equal(typeof row.completionDelivered,'boolean');
 const driver=Uint8Array.from(Buffer.from(row.driver,'base64'));
 const program=runOriginalTandyVoiceUpdate(driver,0x2000,row.args.channel,Uint8Array.from(row.voice),Uint8Array.from(row.timer),Uint8Array.from(row.instrument),row.args.incomingCx,row.args.port61,undefined,true);
 let step=program.next(),first=true;
 while(!step.done){
  assert.equal(step.value.bios.length,1,'Each boundary represents one actual BIOS call');
  if(first){assert.equal(row.completionDelivered,true);assert.deepEqual(completeOriginalTandySample(driver,0x91fb).bios,row.completionBios);if(row.descriptorMutation){const change=row.descriptorMutation,view=new DataView(driver.buffer,driver.byteOffset,driver.byteLength);for(const [offset,value] of [[0x506,change.offset],[0x508,change.segment],[0x50a,change.length],[0x50c,change.divisor]])view.setUint16(offset,value,true);driver[0x50e]=change.volume;}first=false;delivered++;}
  step=program.next(driver);
 }
 assert.equal(first,!row.completionDelivered);
 assert.deepEqual(Buffer.from(driver),Buffer.from(row.driverAfter,'base64'));
 assert.deepEqual(step.value.bios,row.bios);assert.deepEqual(step.value.writes,row.writes);assert.equal(step.value.cx,row.cx);
}
assert.ok(delivered>0);console.log(`${rows.length} original legacy voice cases match per-BIOS resumed driver, writes, requests and CX; ${delivered} explicit original completions`);
