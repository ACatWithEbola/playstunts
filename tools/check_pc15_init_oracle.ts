import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeOriginalPcSpeaker} from '../lib/game/pc-speaker-control.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8')).results;assert.equal(rows.length,2);
for(const [index,row] of rows.entries()){
 const driver=Uint8Array.from(Buffer.from(row.before,'base64')),engine=index===0?'ms-1990':'ms-1991';
 const actual=initializeOriginalPcSpeaker(driver,0,engine);
 assert.equal(actual.channels,row.channels);
 assert.deepEqual(actual.writes,row.virtualPortWrites.map(([port,,value]:number[])=>[port,value]));
 assert.deepEqual(driver,Uint8Array.from(Buffer.from(row.after,'base64')),engine+' original driver writes');
}
console.log('Legacy and MS1991 PC15 initialization matches complete original driver memory and virtual port writes');
