import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {clipMs91Rectangle} from '../lib/game/ms91-clip-rectangle.ts';
const [image,libraries]=process.argv.slice(2);if(!image||!libraries)throw Error('Provide original image and emulator libraries');
const result=spawnSync('python3',['tools/check_original_ms91_clip_rectangle.py',image,libraries],{encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(result.status,0,result.stderr);
const rows=JSON.parse(result.stdout);assert.equal(rows.length,1000);
for(const row of rows){const memory=new Uint8Array(65536);memory.set(Buffer.from(row.before,'hex'),0x100);assert.equal(Number(clipMs91Rectangle(memory,0,row.rect,row.clip)),row.rejected);assert.equal(Buffer.from(memory.subarray(row.rect,row.rect+8)).toString('hex'),row.after);}
console.log('MS91 rectangle clipping matches1000 original executable cases, including aliased records and signed extremes');
