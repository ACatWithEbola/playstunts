import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {resetMs91VideoCaches} from '../lib/game/ms91-video-cache-reset.ts';
const path=process.argv[2];if(!path)throw Error('Supply original video-cache capture');
const rows=JSON.parse(readFileSync(path,'utf8')) as {input:string;output:string}[];assert.equal(rows.length,100);
for(const row of rows){const memory=Uint8Array.from(Buffer.from(row.input,'hex'));resetMs91VideoCaches(memory,0);assert.deepEqual(memory,Uint8Array.from(Buffer.from(row.output,'hex')));}
console.log('All100 full data-segment outputs match originalMS91 cache reset');
