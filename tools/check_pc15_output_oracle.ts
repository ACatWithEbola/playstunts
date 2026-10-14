import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stepOriginalPcSpeakerOutput} from '../lib/game/pc-speaker-output.ts';
import {stepOriginalPcSpeakerVoiceTimer} from '../lib/game/pc-speaker-voice-timer.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,2000);
for(const [index,row] of rows.entries()){
 const driver=Uint8Array.from(Buffer.from(row.before,'base64'));
 assert.deepEqual(stepOriginalPcSpeakerOutput(driver,row.port61,row.engine).writes,row.writes,'ports case'+index);
 assert.deepEqual(driver,Uint8Array.from(Buffer.from(row.after,'base64')),'driver case'+index);
 const timer=stepOriginalPcSpeakerVoiceTimer({physicsEngine:row.engine,driver:Uint8Array.from(Buffer.from(row.before,'base64')),voices:Array.from({length:row.engine==='ms-1991'?7:5},()=>new Uint8Array(46)),timers:Array.from({length:24},()=>new Uint8Array(72)),lastNotes:new Uint8Array(24)},()=>{throw Error('Inactive voice must not fetch an instrument');},row.port61);
 assert.equal(timer.physicsEngine,row.engine);assert.deepEqual(timer.writes,row.writes,'timer wrapper ports'+index);assert.deepEqual(timer.driver,driver,'timer wrapper retained driver'+index);
}
console.log('PASS2000 complete original PC15 output states and virtual port sequences, both versions');
