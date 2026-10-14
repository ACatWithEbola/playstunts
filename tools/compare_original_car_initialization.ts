import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {initializeCar} from '../lib/physics/initialize-car.ts';
import {encodeMs91BodyCache} from '../lib/game/ms91-body-cache-memory.ts';
import type {Vector} from '../lib/physics/math.ts';
const [legacy,modern,cars,libraries]=process.argv.slice(2);assert.ok(legacy&&modern&&cars&&libraries);
const run=spawnSync('python3',['tools/check_original_car_initialization.py',legacy,modern,cars,'--libraries',libraries],{encoding:'utf8',maxBuffer:3000000});assert.equal(run.status,0,run.stderr);
const capture=JSON.parse(run.stdout);assert.equal(capture.cases.length,528);assert.equal(capture.sourcesUnchanged,true);
for(const row of capture.cases){
 const before=new Uint8Array(184).fill(0x7d),source=before.slice(),tuning=new Uint8Array(Buffer.from(capture.tunings[row.car],'hex'));
 const result=initializeCar(before,tuning,row.transmission,row.position,row.heading,row.engine);
 let actual=result;
 if(row.engine==='ms-1991'){
  const point=row.position.map((n:number)=>n>>6) as Vector,cache=encodeMs91BodyCache([point,point,point,point]);
  actual=new Uint8Array(208);actual.set(result.subarray(0,140));actual.set(cache,140);actual.set(result.subarray(140),164);
 }
 assert.deepEqual(Buffer.from(actual),Buffer.from(row.output,'hex'),JSON.stringify({...row,output:undefined}));
 assert.deepEqual(before,source);
}
console.log(JSON.stringify({completeOriginalCarCases:528,all11Cars:true,bothEngines:true,retainedStateCompared:true,sourcesUnchanged:true,pass:true}));
