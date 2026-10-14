import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {updateMs91TandyVoice} from '../lib/game/ms91-tandy-voice-update.ts';
import {updateOriginalTandyVoice} from '../lib/game/tandy-voice-update.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,1000);
for(const [index,row] of rows.entries()){
 const driver=Uint8Array.from(Buffer.from(row.driver,'base64')),voice=Uint8Array.from(row.voice),a=row.args;
 const result=row.legacy?updateOriginalTandyVoice(driver,0x2000,a.channel,voice,Uint8Array.from(row.timer),Uint8Array.from(row.instrument),a.incomingCx,a.port61,'ms-1990'):updateMs91TandyVoice(driver,a.channel,voice,Uint8Array.from(row.timer),Uint8Array.from(row.instrument),a.incomingCx,a.port61);
 assert.deepEqual(driver,Uint8Array.from(Buffer.from(row.driverAfter,'base64')),`driver ${index}`);assert.deepEqual([...voice],row.voiceAfter,`voice ${index}`);assert.deepEqual(result,{writes:row.writes,cx:row.cx,...(row.legacy?{bios:row.bios}:{})},`output ${index}`);
}
console.log(`1000 original ${rows[0].legacy?'legacy':'modern'} TD15 voice updates match complete driver/voice,output ports,BIOS requests where applicable and retained CX across tone,sample,PC,bend/modulation and mute cases`);
