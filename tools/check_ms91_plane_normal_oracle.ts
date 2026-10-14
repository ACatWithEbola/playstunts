import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalProduct,planeDistance} from '../lib/physics/plane.ts';
import {rotateZXY} from '../lib/physics/rotation.ts';
import type {Vector} from '../lib/physics/math.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8')) as {vector:Vector;normal:Vector;result:number;planeId?:number;origin:Vector;tile:Vector}[];
for(const [index,row] of rows.entries()){
 const result=row.planeId===undefined?normalProduct(row.vector,row.normal):planeDistance(row.vector,{id:row.planeId,roll:0,pitch:0,origin:row.origin,normal:row.normal,rotation:rotateZXY(0,0,0)},row.tile);
 assert.equal(result,row.result,'MS91 original plane arithmetic mismatch at case '+index);
}
console.log('Plane arithmetic matches '+rows.length+' original MS91 outputs');
