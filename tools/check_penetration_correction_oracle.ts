import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {i16,vecTransform,type Vector} from '../lib/physics/math.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,60);
for(const row of rows){
 let distance=row.distance,point=row.point;
 if(distance<0){
  if(row.flag)distance=i16(-distance+6);
  const correction=vecTransform([0,i16(-distance<<6),0],row.matrix);
  point=point.map((n:number,axis:number)=>(n+correction[axis])|0) as Vector;
 }
 assert.deepEqual({point,distance},row.result);
}
console.log('60 paired original correction outputs match native signed-distance,16-bit shift,matrix transform and32-bit position update; enclosing response/global crash effects remain separate');
