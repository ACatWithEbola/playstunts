import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {startMs91TandyNote} from '../lib/game/ms91-tandy-note.ts';
import {startOriginalTandyNote} from '../lib/game/tandy-note.ts';
import {readTandySampleResource} from '../lib/game/read-tandy-sample-resource.ts';
const corpus=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(corpus.rows.length,512);
for(const [index,row] of corpus.rows.entries()){
 const driver=Uint8Array.from(Buffer.from(corpus.driver,'base64')),voice=Uint8Array.from(row.voice),instrument=Uint8Array.from(row.instrument),a=row.args;
 let sample=row.sample;
 if(corpus.legacy){const memory=new Uint8Array(0x100000),view=new DataView(memory.buffer);view.setUint16(row.sample.segment*16+((row.sample.offset+8)&65535),row.sample.length,true);sample=readTandySampleResource(memory,instrument[6]|instrument[7]<<8,instrument[8]|instrument[9]<<8);assert.deepEqual(sample,row.sample);}
 const request=corpus.legacy?startOriginalTandyNote(driver,a.channel,voice,instrument,a.note,a.velocity,a.incomingCx,a.incomingDx,sample):startMs91TandyNote(driver,a.channel,voice,instrument,a.note,a.velocity,a.incomingCx,a.incomingDx);
 assert.deepEqual(driver,Uint8Array.from(Buffer.from(row.driverAfter,'base64')),`driver ${index}`);assert.deepEqual([...voice],row.voiceAfter,`voice ${index}`);
 assert.deepEqual(request?[request]:[],row.requests,`request ${index}`);
}
console.log(`512 original ${corpus.legacy?'legacy':'modern'} Tandy note cases match complete driver/voice and sample-start requests,including noteFF register retention`);
