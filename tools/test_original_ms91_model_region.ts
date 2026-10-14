import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {configureMs91ModelRegion} from '../lib/game/ms91-model-region-policy.ts';
const [image,libraries]=process.argv.slice(2);if(!image||!libraries)throw Error('Provide original image and emulator libraries');
const result=spawnSync('python3',['tools/check_original_ms91_model_region.py',image,libraries],{encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(result.status,0,result.stderr);
const rows=JSON.parse(result.stdout);assert.equal(rows.length,200);
for(const row of rows){
 const memory=new Uint8Array(65536),v=new DataView(memory.buffer);v.setUint16(0xb138,0x1000,true);v.setUint16(0x9690,row.enabled,true);memory[row.kind==='first'?0x93bb:0x948b]=row.visibility;memory.set(Buffer.from(row.empty,'hex'),0x339a);memory.set(Buffer.from(row.descriptor,'hex'),0x1000);
 configureMs91ModelRegion(memory,0,0xe000,row.kind);assert.equal(Buffer.from(memory.subarray(0x1000,0x1014)).toString('hex'),row.after);
 if(!row.enabled&&row.visibility===1){const local=0xe000-(row.kind==='first'?0x6a:0x8e);assert.equal(Buffer.from(memory.subarray(local,local+8)).toString('hex'),row.local);}
}
console.log('Both MS91 model-region routing branches match200 original executable cases with bounded persistent writes');
