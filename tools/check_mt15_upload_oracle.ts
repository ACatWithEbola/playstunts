import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {uploadOriginalMt32Patches} from '../lib/game/mt32-system-exclusive.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,4);
for(const row of rows){
 const driver=Uint8Array.from(Buffer.from(row.before,'base64')),program=uploadOriginalMt32Patches(driver,(_segment,offset)=>row.patch[offset],0,0,row.engine),writes:number[][]=[];let step=program.next();
 while(!step.done){if(step.value.kind==='write')writes.push([step.value.port,step.value.value]);step=program.next(0);}
 assert.deepEqual(writes,row.writes,row.engine+' ports');assert.deepEqual(driver,Uint8Array.from(Buffer.from(row.after,'base64')),row.engine+' complete driver');
}
console.log('Four original patch/timbre uploads match complete driver bytes and all virtual port writes, both releases');
