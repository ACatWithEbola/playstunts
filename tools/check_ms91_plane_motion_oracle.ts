import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planeMovement} from '../lib/physics/plane.ts';
import {rotateZXY,type Matrix} from '../lib/physics/rotation.ts';
import type {Vector} from '../lib/physics/math.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8')) as {id:number;roll:number;pitch:number;carRoll?:number;carPitch?:number;originalCarMatrix?:Matrix|null;rotation:Matrix;distance:number;yaw:number;wheel:number;result:Vector}[];
assert.ok(rows.length>0,'An empty oracle is not a passing comparison');
for(const row of rows)if(row.originalCarMatrix){
 assert.ok(row.originalCarMatrix.some(Boolean),'Original matrix must be initialized');
 assert.deepEqual(rotateZXY(-(row.carRoll??row.roll),-(row.carPitch??row.pitch),-row.yaw),row.originalCarMatrix,'Original intermediate rotation mismatch for plane '+row.id);
}
for(const row of rows)assert.deepEqual(planeMovement(row.distance,row.wheel,[row.yaw,row.carPitch??row.pitch,row.carRoll??row.roll],{id:row.id,roll:row.roll,pitch:row.pitch,rotation:row.rotation,origin:[0,0,0],normal:[0,0,0]}),row.result,'Original MS91 motion mismatch for plane '+row.id);
console.log('Plane motion matches all '+rows.length+' original MS91 cases');
