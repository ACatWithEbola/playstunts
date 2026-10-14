import assert from 'node:assert/strict';
import {projectOriginalPrimitiveVertices} from '../lib/game/project-primitive-vertices.ts';
import {projectOriginalModelPrimitive} from '../lib/game/project-model-primitive.ts';
import type {Vector} from '../lib/physics/math.ts';
for(const engine of ['ms-1990','ms-1991','bb-1991'] as const){
 const vertices:Vector[]=Array.from({length:64},(_,i)=>[(i*17)%211-100,(i*31)%137-60,(i*43)%301-20]);
 const initial={vectors:vertices.map(()=>[0,0,0] as Vector),points:vertices.map(()=>[0,0]),flags:vertices.map(()=>255)};
 let pure=structuredClone(initial),owned=structuredClone(initial);const original=structuredClone(initial);
 for(let step=0;step<128;step++){
  const indices=Array.from({length:4},(_,i)=>(step*3+i*7)%64);
  const args=[vertices,indices,[16384,0,0,0,16384,0,0,0,16384] as number[],[0,0,100] as Vector,1,[160,100],[100,100],[0,320,0,200]] as const;
  const previous=structuredClone(pure),copy=projectOriginalPrimitiveVertices(...args,pure,engine);
  const reused=projectOriginalPrimitiveVertices(...args,owned,engine,'owned');
  assert.deepEqual(copy,reused);assert.deepEqual(pure,previous,'Default pure projection must preserve caller cache');
  assert.equal(reused.vectors,owned.vectors);assert.equal(reused.points,owned.points);assert.equal(reused.flags,owned.flags);
  pure=copy;owned=reused;
  for(const kind of [0,1,2,3,4,5]){
   const count=[4,2,2,6,1,1][kind],primitiveArgs:typeof args=[vertices,Array.from({length:count},(_,i)=>(step*3+i*7)%64),args[2],args[3],args[4],args[5],args[6],args[7]];
   const untouched=structuredClone(pure),scratch=structuredClone(pure),output=Array.from({length:20},()=>[0,0]);
   const projected=projectOriginalModelPrimitive(kind,...primitiveArgs,pure,output,0,0,0,[0,320,0,200],engine);
   const inPlace=projectOriginalModelPrimitive(kind,...primitiveArgs,scratch,output,0,0,0,[0,320,0,200],engine,'owned');
   assert.deepEqual(projected,inPlace);assert.deepEqual(pure,untouched);assert.ok(output.every(point=>point.every(value=>value===0)));
  }
 }
 assert.deepEqual(initial,original);
}
console.log('Owned renderer scratch cache matches pure projection across384 reused primitive calls; default callers retain immutable input');
