import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {originalScaledSpriteLayout} from '../lib/game/scaled-sprite-layout.ts';
const [image,libraries]=process.argv.slice(2);if(!image||!libraries)throw Error('Provide original MS91 image and emulator libraries');
const execution=spawnSync('python3',['tools/check_original_ms91_scaled_sprite_layout.py',image,libraries],{encoding:'utf8',maxBuffer:2*1024*1024});assert.equal(execution.status,0,execution.stderr);
const rows=JSON.parse(execution.stdout);assert.equal(rows.length,128);
for(const row of rows){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),c=0x209e0,source=0x90000;
 [12,9,6,4,0,17].forEach((n,i)=>v.setUint16(source+i*2,n,true));
 for(const [at,n] of [[0x912c,row.clip[0]],[0x912e,row.clip[1]],[0x9122,row.clip[2]],[0x9124,row.clip[3]]])v.setUint16(c+at,n,true);
 const layout=originalScaledSpriteLayout(memory,'ega',0,0x9000,row.scale,{x:row.x,y:row.y});
 if(!row.result){assert.equal(layout,undefined,JSON.stringify(row));continue;}
 assert.ok(layout);const {phaseX,storedY,...actual}=layout;
 assert.deepEqual({...actual,phase:(storedY^phaseX)&1},row.result,JSON.stringify({scale:row.scale,x:row.x,y:row.y,clip:row.clip}));
}
console.log('EGA scaled-sprite preparation matches128 original MS91 executable scaling, anchoring, clipping and sampling cases before drawing');
