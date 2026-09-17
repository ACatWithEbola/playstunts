import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {createLiveGraphicsMotion,type GraphicsMotionFrame} from '../lib/game/live-graphics-motion.ts';
import {upgradedSourceCamera} from '../lib/game/upgraded-source-camera.ts';

const source=(n:number):GraphicsMotionFrame=>({
 camera:{position:[n*10,100+n%2,1000+n*20],rotation:[0,0,(1020+n*3)%1024]},
 cars:[{position:[n*10,n%2*4,1000+n*20],rotation:[(1020+n*3)%1024,0,0]},{position:[n*8,2+n%2*3,1300+n*19],rotation:[(1020+n*2)%1024,0,0]}],
 steering:[n*4,n?-n*3:0],wheels:[[[1,n%2*4,2]],[[3,n%2*3,4]]],
});
const arrivals=[0,50];for(let i=0;i<18;i++)arrivals.push(arrivals.at(-1)!+[100/3,50,200/3][i%3]);

for(const rate of [60,120,240])await test(`33/50/67 ms source arrivals preserve displayed camera, both cars and suspension at ${rate} Hz`,()=>{
 const motion=createLiveGraphicsMotion(),view=new PerspectiveCamera(70,4/3,1,200000);
 const point=new Vector3(180,0,-2000),project=(value:GraphicsMotionFrame)=>{
  const camera=upgradedSourceCamera(value.camera);view.position.set(...camera.position);view.up.set(...camera.up);view.lookAt(...camera.target);view.updateMatrixWorld();
  return point.clone().project(view);
 };
 let index=0,lastX=-Infinity,updates=0;
 motion.sample(source(0),0,'0',false,0);
 for(let sample=1;sample<=Math.ceil(arrivals.at(-1)!*rate/1000);sample++){
  const now=sample*1000/rate;
  const before=motion.sample(source(index),index,'0',false,now);
  if(index+1<arrivals.length&&arrivals[index+1]<=now+1e-7){
   index++;
   const after=motion.sample(source(index),index,'0',false,now);
   assert.deepEqual(after,before,'a new source frame must begin at the currently displayed blend, not the previous target');
   assert.ok(project(after).distanceTo(project(before))<1e-10,'static oblique road markings cannot move at the instant a source frame arrives');
   updates++;
  }
  const shown=motion.sample(source(index),index,'0',false,now);
  assert.ok(shown.cars[0].position[0]>=lastX,'forward source motion must not reverse');lastX=shown.cars[0].position[0];
  assert.ok(shown.cars[0].position[1]>=0&&shown.cars[0].position[1]<=4,'interpolation must not predict or overshoot suspension');
  assert.ok(shown.wheels![0][0][1]>=0&&shown.wheels![0][0][1]<=4);
 }
 assert.equal(updates,arrivals.length-1);
});

await test('ordinary 50 ms source cadence retains the original blend and duplicate presentations do not restart it',()=>{
 const motion=createLiveGraphicsMotion();motion.sample(source(0),0,'0',false,0);motion.sample(source(1),1,'0',false,50);
 assert.equal(motion.sample(source(1),1,'0',false,75).cars[0].position[0],5);
 assert.equal(motion.sample(source(1),1,'0',false,75).cars[0].position[0],5);
 assert.equal(motion.sample(source(1),1,'0',false,90).cars[0].position[0],8);
 assert.equal(motion.sample(source(2),2,'0',false,100).cars[0].position[0],10);
 assert.equal(motion.sample(source(2),2,'0',false,125).cars[0].position[0],15);
});

await test('camera cuts, pauses and seeks remain immediate',()=>{
 const motion=createLiveGraphicsMotion();motion.sample(source(0),10,'0',false,0);motion.sample(source(1),11,'0',false,50);
 assert.deepEqual(motion.sample(source(2),12,'0',true,75),source(2));
 assert.deepEqual(motion.sample(source(0),1,'2',false,80),source(0));
 const cut=source(3);cut.camera.position[0]+=1000;
 assert.deepEqual(motion.sample(cut,2,'2',false,90,true),cut);
});
