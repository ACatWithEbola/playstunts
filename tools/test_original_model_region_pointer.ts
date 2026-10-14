import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {renderOriginalModelMemory} from '../lib/game/render-model-memory.ts';
const [image,libraries]=process.argv.slice(2);assert.ok(image&&libraries);
const run=spawnSync('python3',['tools/check_original_model_region_pointer.py',image,libraries],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
const rows=JSON.parse(run.stdout);assert.equal(rows.length,256);
for(const row of rows){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),record=0x1000,model=0x2000;
 v.setUint16(record+6,model,true);v.setUint16(record+8,0x1234,true);v.setUint16(record+16,2048,true);memory[record+18]=row.flags;memory[model+8]=1;
 v.setUint16(0x5f32,0xaaaa,true);[16384,0,0,0,16384,0,0,0,16384].forEach((n,i)=>v.setInt16(0xaa5c+i*2,n,true));
 const cache={vectors:Array.from({length:8},()=>[0,0,0] as [number,number,number]),points:Array.from({length:8},()=>[0,0]),flags:Array(8).fill(0)};
 renderOriginalModelMemory(memory,0,record,cache,undefined,undefined,undefined,true,'ms-1991');
 assert.equal(v.getUint16(0x5f32,true),row.region,'Actual model submission pointer gate flags'+row.flags);
}
console.log('Actual model-submission retained region-pointer gate matches256 original MS91 instruction cases');
