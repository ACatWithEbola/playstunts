import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {carsOverlap} from '../lib/physics/car-overlap.ts';
import {signContact,signsAfterImpact} from '../lib/physics/sign-contact.ts';
import {generateParticles,type Particles} from '../lib/game/particles.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));
assert.equal(rows.length,50);
let impacts=0;
for(const row of rows){
 assert.deepEqual(row.signDimensions,[5,40,5,10]);
 const hit=!row.beforeMarked&&carsOverlap({position:[row.x,row.height,0],angles:[0,0,0],dimensions:[19,17,56],radius:62},{position:[0,0,0],angles:[0,0,0],dimensions:[5,40,5],radius:10});
 assert.equal(row.marked,hit?1:row.beforeMarked);
 // Translate the whole isolated test to an interior tile, preserving geometry.
 const cells=Array(900).fill(255);cells[10*30+10]=0;
 const event=signContact({position:[10752+row.x,row.height,10752],angles:[0,0,0],dimensions:[19,17,56],radius:62},{cells,positions:[[10752,0,10752]],broken:[row.beforeMarked]},128,3000);
 assert.equal(!!event,!!hit);
 if(event)assert.deepEqual(event,{index:0,owner:2,yaw:-128,speed:275});
 const initial:Particles={random:[1,2,3,4,5,6],active:0,particles:Array.from({length:24},()=>({x:0,y:0,z:0,angleX:0,angleZ:0,heading:0,speed:0,verticalSpeed:0,style:0,owner:0}))};
 const result=hit?generateParticles(initial,2,-128,Math.trunc(3000*1408/15360),'ms-1991'):initial;
 assert.equal(result.active,row.active);
 assert.deepEqual(result.particles.map(p=>p.owner),row.owners);
 assert.deepEqual(result.particles.map(p=>p.speed),row.speeds);
 if(row.second){
  const data={cells,positions:[[10752,0,10752] as [number,number,number]],broken:[row.beforeMarked]};
  const shared=signsAfterImpact(data,event)!;
  assert.equal(data.broken[0],row.beforeMarked,'Input checkpoint not mutated');
  const second=signContact({position:[10752+row.x,row.height,10752],angles:[0,0,0],dimensions:[19,17,56],radius:62},shared,256,3000);
  assert.equal(second,undefined);
  assert.equal(shared.broken[0],row.second.marked);
  assert.deepEqual(result.random,row.firstRandom);
  assert.deepEqual(result.random,row.second.random,'Second caller consumes no RNG');
  assert.deepEqual(result.particles.map(p=>p.speed),row.second.speeds);
 }
 impacts+=Number(hit);
}
console.log(JSON.stringify({cases:rows.length,impacts,pass:true,runtimeWiringVerified:false}));
