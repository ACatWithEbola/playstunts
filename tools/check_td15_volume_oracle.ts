import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setOriginalTandyVolume,originalTandyVolumeGateWrites} from '../lib/game/tandy-control.ts';
const corpus=JSON.parse(readFileSync(process.argv[2],'utf8'));
assert.equal(corpus.rows.length,1536);
for(const row of corpus.rows){
 const driver=Uint8Array.from(Buffer.from(corpus.driver,'base64'));
 setOriginalTandyVolume(driver,row.channel,row.volume,'ms-1991');
 assert.deepEqual(driver,Uint8Array.from(Buffer.from(row.after,'base64')));
 assert.deepEqual(originalTandyVolumeGateWrites(row.channel,row.volume,row.port61,'ms-1991'),row.writes);
}
console.log('1536 original executable volume callbacks match complete driver bytes and ordered writes, including immediate modern PC-speaker silence');
