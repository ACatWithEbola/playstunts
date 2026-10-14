import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {buildMs91RolledBackgroundPlan} from '../lib/game/ms91-rolled-background-plan.ts';
const [image,libraries]=process.argv.slice(2);if(!image||!libraries)throw Error('Provide original image and emulator libraries');
const result=spawnSync('python3',['tools/check_original_ms91_rolled_background.py',image,libraries],{encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(result.status,0,result.stderr);
const rows=JSON.parse(result.stdout);assert.equal(rows.length,200);
for(const [index,row] of rows.entries()){
 const plan=buildMs91RolledBackgroundPlan(row.previous,row.working,row.clip,row.base,row.delta,row.height,row.full,row.alignment);
 for(const field of ['sky','clearSky','clearGround'] as const)assert.deepEqual(plan[field],row[field],`Original rolled ${field} case ${index}`);
}
console.log('Rolled sky bounds and requested sky/ground clear rectangles match200 original executable cases across alignment and full redraw');
