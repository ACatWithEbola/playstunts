import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {updateOriginalPcSpeakerVoice} from '../lib/game/pc-speaker-output.ts';
import {setOriginalPcSpeakerVolume} from '../lib/game/pc-speaker-control.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,2000);const decode=(x:string)=>Uint8Array.from(Buffer.from(x,'base64'));
for(const [index,row] of rows.entries()){
 const driver=decode(row.driver),voice=decode(row.voice);
 updateOriginalPcSpeakerVoice(driver,row.channel,voice,decode(row.timer),decode(row.instrument),row.engine);
 assert.deepEqual(driver,decode(row.afterDriver),'driver update'+index);assert.deepEqual(voice,decode(row.afterVoice),'voice update'+index);
 const volumeDriver=decode(row.driver);setOriginalPcSpeakerVolume(volumeDriver,row.channel,row.volume,row.engine);assert.deepEqual(volumeDriver,decode(row.afterVolume),'volume'+index);
}
console.log('PASS2000 original voice-update and volume cases, both engines, full driver/voice state');
