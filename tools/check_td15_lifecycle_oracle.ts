import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeOriginalTandy,silenceOriginalTandy,shutdownOriginalTandy,stopOriginalTandyChannel} from '../lib/game/tandy-lifecycle.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,512);
for(const [index,row] of rows.entries()){
 const driver=Uint8Array.from(Buffer.from(row.before,'base64'));const previous={offset:0x1234,segment:0x5678};
 const generation=row.legacy?'ms-1990':'ms-1991';
 const result=row.action==='initialize'?initializeOriginalTandy(driver,0x2000,row.port61,previous,generation):row.action==='silence'?silenceOriginalTandy(driver,0x2000,row.port61,generation):row.action==='shutdown'?shutdownOriginalTandy(driver,0x2000,row.port61,generation):stopOriginalTandyChannel(driver,0x2000,row.channel,row.port61,generation);
 assert.deepEqual(driver,Uint8Array.from(Buffer.from(row.after,'base64')),`driver ${index}`);assert.deepEqual(result.writes,row.writes,`ports ${index}`);assert.deepEqual(result.bios,row.bios??[]);
 if(row.legacy){const vector=row.action==='initialize'?(result as ReturnType<typeof initializeOriginalTandy>).installVector:row.action==='shutdown'?(result as ReturnType<typeof shutdownOriginalTandy>).restoreVector:previous;assert(vector);assert.deepEqual(row.vector,[vector.offset&255,vector.offset>>>8,vector.segment&255,vector.segment>>>8]);}
}
console.log('512 original Tandy idle lifecycle cases match complete driver bytes and ordered ports across init,silence,shutdown and all channel stops');
