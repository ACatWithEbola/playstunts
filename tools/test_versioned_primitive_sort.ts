import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {originalPrimitiveRecordHeader} from '../lib/game/primitive-record-header.ts';
const header=(model:number,primitive:number,engine?:'ms-1990'|'ms-1991')=>originalPrimitiveRecordHeader(800,4,3,45,7,model,primitive,engine);
for(let model=0;model<256;model++)for(let primitive=0;primitive<256;primitive++){
 const legacy=header(model,primitive,'ms-1990'),modern=header(model,primitive,'ms-1991');
 assert.equal(legacy.sort,(model&1)||(primitive&2)?0:1);assert.equal(modern.sort,(model&1)||(primitive&6)?0:1);
 assert.deepEqual(header(model,primitive),legacy);
 assert.deepEqual({...legacy,sort:modern.sort},modern,'Only queue policy may change');
}
console.log('All65536 model/primitive flag combinations preserve legacy default and route modern bit4 without altering depth/material fields');
if(process.argv.length>2){
 const [legacy,modern,libraries]=process.argv.slice(2);assert.ok(legacy&&modern&&libraries);
 const run=spawnSync('python3',['tools/check_original_primitive_sort.py',legacy,modern,'--libraries',libraries],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
 const rows=JSON.parse(run.stdout);assert.equal(rows.length,1024);
 for(const row of rows)assert.equal(header(row.model,row.primitive,row.engine).sort,row.sort);
 console.log('Original sort-policy branch matches1024 independently executed cases across both engines');
}
