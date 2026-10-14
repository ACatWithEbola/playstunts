import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {buildMs91RepaintPlan} from '../lib/game/ms91-repaint-plan.ts';
const [image,libraries]=process.argv.slice(2);if(!image||!libraries)throw Error('Provide original image and emulator libraries');
const result=spawnSync('python3',['tools/check_original_ms91_repaint_plan.py',image,libraries],{encoding:'utf8',maxBuffer:8*1024*1024});assert.equal(result.status,0,result.stderr);
const rows=JSON.parse(result.stdout);assert.equal(rows.length,200);
for(const [index,row] of rows.entries()){
 const plan=buildMs91RepaintPlan(row.flags,row.current,row.retained,row.clip,row.alignment);
 assert.deepEqual(plan.rectangles,row.rectangles,`Original combined rectangles case ${index}`);assert.deepEqual(plan.order,row.order,`Original combined order case ${index}`);
}
console.log('Combined MS91 repaint selection, clipping, merging and ordering match200 original executable cases with15 old/new regions each');
