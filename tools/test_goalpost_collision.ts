import assert from 'node:assert/strict';
import {test} from 'node:test';
import {originalRaceTrackGeometry, originalStartFinishPosts} from '../lib/game/native-race-session.ts';
import {carsOverlap, type CollisionBody} from '../lib/physics/car-overlap.ts';
import {proposeWheels} from '../lib/physics/chassis.ts';
import type {EngineState} from '../lib/physics/engine.ts';
import type {GripState} from '../lib/physics/grip.ts';
import type {LevelState} from '../lib/physics/level-step.ts';
import {type Vector} from '../lib/physics/math.ts';
import {rotateZXY} from '../lib/physics/rotation.ts';
import {roadsidePosts} from '../lib/physics/roadside-posts.ts';
import {startHeading} from '../lib/physics/start-heading.ts';
import type {TrackGeometry} from '../lib/physics/track-contact.ts';
import {moveTrack} from '../lib/physics/track-step.ts';
import {stepDrivingCar} from '../lib/game/driving-step.ts';
import type {DrivingState} from '../lib/game/driving-step.ts';

const d=0x200;
function simulation(dimensions:Vector,radius:number){
 const bytes=new Uint8Array(240),view=new DataView(bytes.buffer);
 dimensions.forEach((value,axis)=>view.setInt16(200+axis*2,value,true));
 view.setInt16(206,radius,true);
 return view;
}

await test('race wiring derives start/finish supports from original memory for each car',()=>{
 const memory=new Uint8Array(0x800),view=new DataView(memory.buffer);
 view.setInt16(d+0x122,0,true);view.setInt16(d+0x124,450,true);
 const start={column:7,row:24,angle:768,hill:1 as const};
 const player=originalStartFinishPosts(memory,d,simulation([40,50,90],100),start);
 const opponent=originalStartFinishPosts(memory,d,simulation([30,35,65],75),start);
 assert.deepEqual(player,{column:7,terrainRow:24,height:450,heading:768,dimensions:[40,50,90],radius:100});
 assert.deepEqual(opponent,{column:7,terrainRow:24,height:450,heading:768,dimensions:[30,35,65],radius:75});
 assert.equal(originalStartFinishPosts(memory,d,simulation([40,50,90],100),{...start,hill:0}).height,0);
 const base={raw:Array(1802).fill(0),objects:[{id:0,rotation:0,surface:1,multiTile:0,physics:0}],planes:[{id:0,roll:0,pitch:0,origin:[0,0,0] as Vector,normal:[0,8192,0] as Vector,rotation:rotateZXY(0,0,0)}],walls:[]};
 const playerTrack=originalRaceTrackGeometry(memory,d,simulation([40,50,90],100),start,base);
 const opponentTrack=originalRaceTrackGeometry(memory,d,simulation([30,35,65],75),start,base);
 assert.deepEqual(playerTrack.posts,player);assert.deepEqual(opponentTrack.posts,opponent);
 assert.deepEqual(playerTrack.landmarks?.dimensions,[40,50,90]);assert.deepEqual(opponentTrack.landmarks?.dimensions,[30,35,65]);
});

await test('both supports match original placement for every heading and leave the centre and overhead clear',()=>{
 const dimensions:Vector=[40,50,90],radius=100,column=7,row=24;
 for(const height of [0,450])for(const heading of [0,256,512,768]){
 const posts=roadsidePosts(column,row,height,heading);
  assert.equal(posts.length,2);
  const centreX=column*1024+512,centreZ=(29-row)*1024+512;
  const offsets:Record<number,Vector[]>={0:[[126,0,0],[-126,0,0]],256:[[0,0,-126],[0,0,126]],512:[[-126,0,0],[126,0,0]],768:[[0,0,126],[0,0,-126]]};
  assert.deepEqual(posts.map(post=>post.position),offsets[heading].map(([x,y,z])=>[centreX+x,height+y,centreZ+z]),'supports remain exactly 126 units from the tile centre');
  for(const post of posts){
   const car:CollisionBody={position:[post.position[0],height+10,post.position[2]],angles:[0,0,0],dimensions,radius};
   assert.equal(carsOverlap(car,post),true,`support collision at height ${height}, heading ${heading}`);
   assert.equal(carsOverlap({...car,position:[car.position[0],height+122,car.position[2]]},post),false,'no crossbar or overhead collision');
  }
  const centre:CollisionBody={position:[centreX,height+10,centreZ],angles:[0,0,0],dimensions,radius};
  assert.equal(posts.some(post=>carsOverlap(centre,post)),false,'the road centre remains passable');
 }
});

const zeroEngine:EngineState={speed:0,roadSpeed:0,lastSpeed:0,speedDiff:0,rpm:0,lastRPM:0,gear:0,ratio:0,ratioHigh:0,gravity:0,rearContact:2,allContact:4,automatic:0,shifting:0,shiftTimer:0,limiter:0,knobX:0,knobY:0,targetX:0,targetY:0,accelerating:0,braking:0};
const zeroGrip:GripState={speed:0,roadSpeed:0,steeringAngle:0,wheelAngle:0,spin:0,frontWheelAngle:0,slip:0,demandedGrip:0,surfaceGrip:0,allContact:4,surfaces:[1,1,1,1],sliding:0,crash:0,soundFlags:0,yaw:0,roll:0};
const wheels=[[-40,0,80],[40,0,80],[40,0,-80],[-40,0,-80]].map(point=>point.map(value=>value*64) as Vector);
const flatTrack:Omit<TrackGeometry,'posts'>={
 raw:Array(1802).fill(0),objects:[{id:0,rotation:0,surface:1,multiTile:0,physics:0}],
 planes:[{id:0,roll:0,pitch:0,origin:[0,0,0],normal:[0,8192,0],rotation:rotateZXY(0,0,0)}],walls:[],
};
function stateAt(position:Vector,dimensions:Vector,radius:number,heading=0):{state:LevelState;track:TrackGeometry}{
 const pose={position:position.map((value,axis)=>value*64+(axis===1?384:0)) as Vector,rotation:[0,0,0] as Vector};
 const chassis={...pose,roadSpeed:0,frontWheelAngle:0,wheelAngle:0,spin:0,allContact:4,suspension:[0,0,0,0]};
 const state:LevelState={pose,engine:{...zeroEngine},grip:{...zeroGrip},suspension:{rc1:[0,0,0,0],rc2:[0,0,0,0],rc4:[0,0,0,0],rc5:[0,0,0,0]},wheelPositions:proposeWheels(chassis,wheels).map(point=>point.map(value=>value>>6) as Vector),contactWheelAngles:[0,0,0,0]};
 return {state,track:{...flatTrack,posts:{column:7,terrainRow:24,height:position[1],heading,dimensions,radius}}};
}

await test('movement requests the ordinary crash, retains the pose, and is deterministic',()=>{
 for(const heading of [0,256,512,768])for(const support of roadsidePosts(7,24,0,heading)){
  for(const [dimensions,radius] of [[[40,50,90],100],[[30,35,65],75]] as [Vector,number][]){
   const {state,track}=stateAt(support.position,dimensions,radius,heading);
   const first=moveTrack(state,wheels,track,{...state.engine},{...state.grip},0);
   const restored=structuredClone(state);
   const repeated=moveTrack(restored,wheels,track,{...restored.engine},{...restored.grip},0);
   assert.equal(first.grip.crash,1);assert.deepEqual(first.crashEvents,[1]);
   assert.deepEqual(first.pose.position,state.pose.position,'a support hit rejects the proposed pose');
   assert.deepEqual(repeated,first,'restoring the pre-impact state reproduces the same collision frame');
   const crashed={...state,grip:{...state.grip,crash:1}};
   assert.deepEqual(moveTrack(crashed,wheels,track,{...crashed.engine},{...crashed.grip},0).crashEvents,[],'an existing crash is not requested twice');
  }
 }
 const centre=stateAt([7*1024+512,0,(29-24)*1024+512],[40,50,90],100);
 assert.deepEqual(moveTrack(centre.state,wheels,centre.track,{...centre.state.engine},{...centre.state.grip},0).crashEvents,[],'the centre passage remains clear');
 const wrongTile=stateAt([6*1024+512,0,(29-24)*1024+512],[40,50,90],100);
 assert.deepEqual(moveTrack(wrongTile.state,wheels,wrongTile.track,{...wrongTile.state.engine},{...wrongTile.state.grip},0).crashEvents,[],'supports do not collide outside their start tile');
});

await test('all original start/finish tile variants retain their heading',()=>{
 const expected=new Map([[1,0],[134,0],[147,0],[135,512],[148,512],[179,512],[136,256],[149,256],[180,256],[137,768],[150,768],[181,768]]);
 for(const [tile,heading] of expected)assert.equal(startHeading(tile),heading);
});

await test('modern movement emits sign debris without a crash and leaves legacy playback isolated',async()=>{
 const {state}=stateAt([7*1024+512,0,5*1024+512],[19,17,56],62);
 const cells=Array(900).fill(255);cells[5*30+7]=0;
 const signs={cells,positions:[[7*1024+512,0,5*1024+512] as Vector],broken:[0]};
 const base:TrackGeometry={...flatTrack,mode:2,landmarks:{dimensions:[19,17,56],radius:62,hillHeight:450},signs};
 const modern=moveTrack(state,wheels,{...base,physicsEngine:'ms-1991'},state.engine,state.grip,0);
 assert.deepEqual(modern.signImpact,{index:0,owner:2,yaw:0,speed:0,afterCrashImpacts:0});
 assert.equal(modern.grip.crash,0);assert.deepEqual(modern.crashEvents,[]);
 assert.equal(signs.broken[0],0,'movement must not mutate its input marker array');
 const repeat=moveTrack(state,wheels,{...base,physicsEngine:'ms-1991'},state.engine,state.grip,0);
 assert.deepEqual(repeat,modern,'same checkpoint state reproduces the sign event');
 assert.equal(moveTrack(state,wheels,{...base,physicsEngine:'ms-1991',signs:{...signs,broken:[1]}},state.engine,state.grip,0).signImpact,undefined);
 assert.equal(moveTrack(state,wheels,{...base,physicsEngine:'ms-1990'},state.engine,state.grip,0).signImpact,undefined);
 const before:DrivingState={car:state,race:{crash:0,speed:0,roadSpeed:0,yaw:0,abortFlag:0,timer:0,stats:Array(11).fill(0),savedStats:Array(11).fill(0),elapsed:0,evaluationCause:0,replay:true,audioEnabled:false,preserveStats:false,audioHandles:[0,1]},particles:{random:[1,2,3,4,5,6],active:0,particles:Array.from({length:24},()=>({x:0,y:0,z:0,angleX:0,angleZ:0,heading:0,speed:0,verticalSpeed:0,style:0,owner:0}))}};
 // Moving directly is independently covered above; driving uses a zero-input
 // tuning fixture to exercise the production debris consumer as well.
 const {fixtureData}=await import('./global-score-fixture.ts');
 const tuning=fixtureData.cars.find((car:{id:string})=>car.id==='PMIN');
 assert.ok(tuning);
 const driven=stepDrivingCar(before,tuning,wheels,0,{...base,physicsEngine:'ms-1991'},1);
 assert.ok(driven.car.signImpact);assert.equal(driven.particles.active,1);
 assert.equal(driven.particles.particles.filter(p=>p.speed!==0&&p.owner===2).length,8);
 assert.equal(driven.car.grip.crash,0);
 const post=roadsidePosts(7,24,0,0)[0],both=stateAt(post.position,[19,17,56],62);
 const simultaneous=stepDrivingCar({...before,car:both.state},tuning,wheels,0,{...base,physicsEngine:'ms-1991',posts:both.track.posts,signs:{...signs,positions:[post.position]}},1);
 assert.equal(simultaneous.car.grip.crash,1);
 assert.equal(simultaneous.car.signImpact?.afterCrashImpacts,0,'Sign event precedes start-support crash');
 assert.equal(simultaneous.particles.particles.filter(p=>p.speed!==0&&p.owner===2).length,8);
 assert.equal(simultaneous.particles.particles.filter(p=>p.speed!==0&&p.owner===0).length,16,'Crash receives only the remaining particle slots');
 const {generateParticles}=await import('../lib/game/particles.ts');
 const expected=generateParticles(generateParticles(before.particles,2,0,0,'ms-1991'),0,0,0,'ms-1991');
 assert.deepEqual(simultaneous.particles,expected,'Debris and RNG follow original caller order');
});
