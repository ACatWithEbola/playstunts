import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createOriginalIntroDriving} from '../lib/game/intro-driving.ts';
import {initializeOriginalIntroScene,originalIntroPath,originalIntroRoute} from '../lib/game/initialize-intro-scene.ts';
import {initializeOriginalCarSimulation} from '../lib/game/initialize-car-simulation.ts';
import {trackOpponentRoutePoint} from '../lib/physics/track-route-point.ts';
import {opponentTick} from '../lib/physics/opponent-tick.ts';
import {readOpponentCarState} from '../lib/game/read-opponent-race-state.ts';
import type {Vector} from '../lib/physics/math.ts';
const assets=JSON.parse(readFileSync('public/game/assets.json','utf8'));
const tuning=assets.cars.find((car:{id:string})=>car.id==='COUN');
const simulation=Uint8Array.from(tuning.rawSimulation.match(/../g),(hex:string)=>parseInt(hex,16));
const raw=assets.tracks.find((track:{name:string})=>track.name==='DEFAULT').raw;
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const memory=new Uint8Array(readFileSync('public/game/native-race-startup.bin')),d=0x2d1a0;
 initializeOriginalCarSimulation(memory,d,simulation,true);
 let engineReads=0;
 const data={...fixtureData,tuning,simulation,raw,get physicsEngine(){engineReads++;return physicsEngine;}};
 const lookup=(entry:number,point:number)=>{const value=trackOpponentRoutePoint(raw,originalIntroRoute,entry,point,data.records,data.points,data.objects,data.indices,memory.subarray(d+0x9362,d+0x9362+511),physicsEngine);return {...value,midpoint:value.midpoint as Vector,first:value.first as Vector,second:value.second as Vector};};
 initializeOriginalIntroScene(memory,d,lookup);
 const initial=memory.slice(d,d+65536),v=new DataView(initial.buffer),sim=new DataView(simulation.buffer);
 const context={previousAngle:0,startX:v.getInt16(0xa3e2+2,true),startZ:v.getInt16(0xa796+56,true),startAngle:v.getInt16(0x9b2a,true),raceWords:Array.from({length:11},(_,i)=>v.getUint16(0x8c22+i*2,true)),savedRaceWords:Array.from({length:11},(_,i)=>v.getUint16(0x899a+i*2,true)),timeAdjustment:v.getUint16(0xa034,true),flags:initial[0x8018]};
 const driving=createOriginalIntroDriving(initial,data),before=initial.slice();
 assert.ok(engineReads>0,'Introduction must retain explicit movement identity at construction, before any route lookup');
 let last=driving.tick() as ReturnType<typeof opponentTick>;
 const wheels=Array.from({length:4},(_,i)=>[0,1,2].map(axis=>sim.getInt16(210+i*6+axis*2,true)) as Vector);
 for(let frame=1;frame<2000;frame++){
  const decoded=readOpponentCarState(driving.bytes,last.decision.routeTarget.side),car=last;
  context.previousAngle=last.race.angle;context.raceWords=last.race.raceWords;context.savedRaceWords=last.race.savedRaceWords;
  const controls={position:car.pose.position,rotation:car.pose.rotation,steering:car.grip.steeringAngle,frontContact:car.grip.surfaces[0]+car.grip.surfaces[1],rearContact:car.engine.rearContact,crash:car.grip.crash,wheelAngle:car.grip.wheelAngle,roadSpeed:car.engine.roadSpeed,speed:car.engine.speed,demandedGrip:car.grip.demandedGrip,surfaceGrip:car.grip.surfaceGrip,sliding:car.grip.sliding,route:decoded.route,routeTarget:decoded.routeTarget,targetAlternate:decoded.targetAlternate};
  const expected=opponentTick([car,[controls,car.engine,tuning,[0,0,0],0,2,originalIntroPath,lookup,200],wheels,{mode:2,physicsEngine,raw,objects:data.objects,planes:data.planes,walls:data.walls},tuning],context);
  last=driving.tick() as ReturnType<typeof opponentTick>;assert.deepEqual(last,expected,physicsEngine+' intro frame '+frame+' must use selected-engine movement');
 }
 assert.deepEqual(initial,before,'Intro source segment remains unchanged');
}
console.log('Both intro movement paths match explicitly engine-tagged opponent ticks for 1999 frames; this is native routing evidence, not a DOS whole-intro oracle');
