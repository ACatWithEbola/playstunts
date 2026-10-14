import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {addMs91Rectangle,type Ms91Rectangle} from '../lib/game/ms91-rectangle-list.ts';
const [image,libraries]=process.argv.slice(2);if(!image||!libraries)throw Error('Provide original image and emulator libraries');
const result=spawnSync('python3',['tools/check_original_ms91_rectangle_list.py',image,libraries],{encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(result.status,0,result.stderr);
const rows=JSON.parse(result.stdout);assert.equal(rows.length,200);
for(const [index,row] of rows.entries()){
 const list:Ms91Rectangle[]=structuredClone(row.initial),incoming=structuredClone(row.incoming);addMs91Rectangle(list,incoming,row.alignment);
 assert.deepEqual(list,row.output,`Original list case ${index}`);assert.deepEqual(incoming,row.incoming,'Input rectangle unchanged');
}
console.log('MS91 repaint-list merging matches200 original executable cases across1/2/4/8-pixel alignment and leaves input rectangles unchanged');
