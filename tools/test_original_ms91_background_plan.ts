import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {buildMs91BackgroundRepaintPlan} from '../lib/game/ms91-background-repaint-plan.ts';
const [image,libraries]=process.argv.slice(2);if(!image||!libraries)throw Error('Provide original image and emulator libraries');
const result=spawnSync('python3',['tools/check_original_ms91_background_plan.py',image,libraries],{encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(result.status,0,result.stderr);
const rows=JSON.parse(result.stdout);assert.equal(rows.length,200);
for(const [index,row] of rows.entries())assert.deepEqual(buildMs91BackgroundRepaintPlan(row.previous,row.working,row.clip,row.previousHeading,row.heading,false,row.alignment,-row.alignment,row.detail,row.last),row.rectangles,`Original background case ${index}`);
console.log('MS91 background flags and merged region order match200 original executable cases across alignment and detail/heading settings');
