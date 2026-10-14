import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {transformOriginalModelVertex} from '../lib/game/transform-model-vertex.ts';
import type {Vector} from '../lib/physics/math.ts';
import {projectOriginalPrimitiveVertices} from '../lib/game/project-primitive-vertices.ts';
import {projectOriginalModelBounds} from '../lib/game/project-model-bounds.ts';
const identity=[16384,0,0,0,16384,0,0,0,16384],translation:Vector=[0,0,0];
for(let value=-32768;value<=32767;value++){
 const point:Vector=[value,value,value];
 const old=transformOriginalModelVertex(point,identity,translation,1,'ms-1990');
 const modern=transformOriginalModelVertex(point,identity,translation,1,'ms-1991');
 const legacyExpected=Math.trunc(value/2)||0;
 assert.deepEqual(old,[legacyExpected,legacyExpected,legacyExpected]);
 const modernExpected=Math.floor(value/2);
 assert.deepEqual(modern,[modernExpected,modernExpected,modernExpected]);
 assert.deepEqual(transformOriginalModelVertex(point,identity,translation,1),old);
 for(const engine of ['ms-1990','ms-1991'] as const)
  assert.deepEqual(transformOriginalModelVertex(point,identity,translation,0,engine),point);
}
console.log('All65536 signed model coordinates: legacy truncation, modern arithmetic shift, unchanged full-size and default legacy behavior pass');
for(const engine of ['ms-1990','ms-1991'] as const){
 const vertices=Array.from({length:8},()=>[-3,-5,200] as Vector),cache={vectors:Array.from({length:8},()=>[0,0,0] as Vector),points:Array.from({length:8},()=>[0,0]),flags:Array(8).fill(255)};
 const expected=engine==='ms-1991'?[-2,-3,200]:[-1,-2,200];
 const primitive=projectOriginalPrimitiveVertices(vertices,[0],identity,[0,0,100],1,[160,100],[100,100],[0,320,0,200],cache,engine);
 const bounds=projectOriginalModelBounds(vertices,identity,[0,0,100],1,[160,100],[100,100],[0,320,0,200],20,cache,engine);
 assert.deepEqual(primitive.vectors[0],expected);assert.deepEqual(bounds.vectors[0],expected);
 assert.deepEqual(cache.flags,Array(8).fill(255),'Projection must preserve source cache');
}
console.log('Bounds and drawing-vertex pipelines both retain explicit engine rounding without mutating source caches');
if(process.argv.length>2){
 const [legacy,modern,libraries]=process.argv.slice(2);assert.ok(legacy&&modern&&libraries);
 const run=spawnSync('python3',['tools/check_original_model_halving.py',legacy,modern,'--libraries',libraries],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
 const rows=JSON.parse(run.stdout);assert.equal(rows.length,512);
 for(const row of rows)assert.deepEqual(transformOriginalModelVertex(row.before,identity,translation,1,row.engine),row.after);
 console.log('Both original halving blocks in both engines match512 independently executed cases');
}
