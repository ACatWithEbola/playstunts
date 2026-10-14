import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {originalTandyPitch} from '../lib/game/tandy-pitch.ts';
const corpus=JSON.parse(readFileSync(process.argv[2],'utf8')),driver=Uint8Array.from(Buffer.from(corpus.driver,'base64'));
assert.equal(corpus.rows.length,1024);
for(const [index,row] of corpus.rows.entries())assert.equal(originalTandyPitch(driver,row.channel,row.note,row.bend,row.span,row.cx),row.result,`pitch ${index}`);
console.log('1024 original removed legacy pitch callbacks match signed bend,byte-wrapped note/range and retained-CX table selection');
