import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {ms91ForwardSkyRegion,ms91FullSkyRegion,ms91RolledSkyRegion} from '../lib/game/ms91-sky-region.ts';
const [image,libraries]=process.argv.slice(2);if(!image||!libraries)throw Error('Provide original image and emulator libraries');
const result=spawnSync('python3',['tools/check_original_ms91_sky_region.py',image,libraries],{encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(result.status,0,result.stderr);
const rows=JSON.parse(result.stdout);assert.equal(rows.length,1500);
for(const row of rows)assert.deepEqual(row.kind==='forward'?ms91ForwardSkyRegion(row.horizon,row.height,row.detail):row.kind==='rolled'?ms91RolledSkyRegion(row.horizon,row.delta,row.height,row.clip,!!row.full):ms91FullSkyRegion(row.clip),row.rectangle);
console.log('Forward, rolled and fallback MS91 sky rectangles match1500 original executable cases with checked write boundaries');
