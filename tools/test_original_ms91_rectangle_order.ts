import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {orderMs91Rectangles} from '../lib/game/ms91-rectangle-list.ts';
const [image,libraries]=process.argv.slice(2);if(!image||!libraries)throw Error('Provide original image and emulator libraries');
const result=spawnSync('python3',['tools/check_original_ms91_rectangle_order.py',image,libraries],{encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(result.status,0,result.stderr);
const rows=JSON.parse(result.stdout);assert.equal(rows.length,200);
for(const [index,row] of rows.entries())assert.deepEqual(orderMs91Rectangles(row.rects),row.order,`Original order case ${index}`);
console.log('MS91 indexed repaint ordering matches200 original executable cases, including ties and signed negation overflow');
