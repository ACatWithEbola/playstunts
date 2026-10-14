import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {initializeMs91VideoRectangles,commitMs91VideoRectangles,prepareMs91VideoRectangleFlags} from '../lib/game/ms91-video-rectangles.ts';
const [image,libraries]=process.argv.slice(2);if(!image||!libraries)throw Error('Provide original MS91 image and emulator library directory');
const result=spawnSync('python3',['tools/check_original_ms91_video_rectangles.py',image,libraries],{encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(result.status,0,result.stderr||'Original emulator failed');
const rows=JSON.parse(result.stdout);assert.equal(rows.length,300);
for(const row of rows){
 const memory=new Uint8Array(65536),v=new DataView(memory.buffer),before=row.before;
 for(const [key,at] of [['empty',0x339a],['working',0x9710],['current',0xa250],['retained',0xa65e]] as const)memory.set(Buffer.from(before[key],'hex'),at);
 v.setUint16(0x9690,before.active,true);v.setUint16(0xb0da,before.identity,true);v.setUint16(0x970a,before.retainedIdentity,true);
 memory[0x192]=before.graphics;memory[0xae6a]=before.count;memory.set(Buffer.from(before.marks,'hex'),0xa224);
 if(row.operation==='initialize')assert.equal(initializeMs91VideoRectangles(memory,0).flags,row.flags);else if(row.operation==='commit')commitMs91VideoRectangles(memory,0);else assert.equal(prepareMs91VideoRectangleFlags(memory,0),!!before.active);
 for(const [key,at,size] of [['empty',0x339a,8],['working',0x9710,120],['current',0xa250,120],['retained',0xa65e,120]] as const)assert.equal(Buffer.from(memory.subarray(at,at+size)).toString('hex'),row.after[key]);
 assert.equal(v.getUint16(0x970a,true),row.after.retainedIdentity);
 assert.equal(memory[0xae6a],row.after.count);assert.equal(Buffer.from(memory.subarray(0xa224,0xa233)).toString('hex'),row.after.marks);
}
console.log('Three MS91 video rectangle steps match300 original-code cases, including unchanged-region suppression and checked write boundaries');
