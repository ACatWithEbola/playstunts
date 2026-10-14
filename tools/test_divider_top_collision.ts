import assert from 'node:assert/strict';
import {fixtureData} from './global-score-fixture.ts';
import {trackPlaneContact,type TrackObject} from '../lib/physics/track.ts';
import {planeDistance} from '../lib/physics/plane.ts';
import {wallResponse} from '../lib/physics/wall-response.ts';
import {placeWall} from '../lib/physics/wall.ts';
import {trackCollisionPoints} from '../lib/physics/track-collision-points.ts';
import {landmarkContact} from '../lib/physics/landmark-contact.ts';
import type {Vector} from '../lib/physics/math.ts';
let checked=0;
for(const engine of ['ms-1990','ms-1991'] as const)for(const rotation of [0,256,512,768]){
 const raw=Array(1802).fill(0);raw[10*30+10]=109;
 const objects=(fixtureData.objects as TrackObject[]).map(o=>o.id===109?{...o,rotation}:o);
 const points=trackCollisionPoints(raw,objects,10,19,450);
 assert.deepEqual(points,[[10752,0,10752]],'Divider tree collision point is at ground height, not raised onto divider');
 const body={position:[10752,31,10752] as Vector,angles:[0,0,0] as Vector,dimensions:[19,17,56] as Vector,radius:62};
 assert.equal(landmarkContact(body,raw,objects,450,0).hit,false,'Car on raised divider clears ground-level tree collision volume');
 assert.equal(landmarkContact({...body,position:[10752,0,10752]},raw,objects,450,0).hit,true,'Tree collision remains active at ground level');
 for(const car of fixtureData.cars){
  const simulation=Buffer.from(car.rawSimulation,'hex'),dimensions=[200,202,204].map(at=>simulation.readInt16LE(at)) as Vector,radius=simulation.readInt16LE(206);
  for(const yaw of [0,256,512,768]){
   // Synthetic horizontal body whose lower face is on the raised surface.
   // This is not a reconstructed suspension landing or Marco's trajectory.
   const raised={position:[10752,25+dimensions[1],10752] as Vector,angles:[yaw,0,0] as Vector,dimensions,radius};
   assert.equal(landmarkContact(raised,raw,objects,450,0).hit,false,car.id+' raised body clears ground-level tree');
   assert.equal(landmarkContact({...raised,position:[10752,0,10752]},raw,objects,450,0).hit,true,car.id+' ground-level tree remains collidable');
  }
 }
 const world=(x:number,y:number,z:number):Vector=>{
  if(rotation===256)[x,z]=[z,-x];else if(rotation===512)[x,z]=[-x,-z];else if(rotation===768)[x,z]=[-z,x];
  return [10*1024+512+x,y,10*1024+512+z];
 };
 for(let z=-496;z<512;z+=32)for(const x of [-119,0,119]){
  const point=world(x,25,z),old=world(x<0?-150:150,25,z),scaled=point.map(v=>v*64) as Vector,previous=old.map(v=>v*64) as Vector;
  const contact=trackPlaneContact(raw,objects,scaled,previous,0,[0,0,0],engine);
  assert.equal(contact.planeId,4+(((1024-rotation)&1023)>>8));
  const distance=planeDistance(point,fixtureData.planes[contact.planeId],contact.tileOrigin);assert.ok(Math.abs(distance)<=2,'Wheel follows raised divider surface including original surface offset');
  assert.notEqual(contact.wall,-1,'Side crossing exercises a real selected wall');
  const response=wallResponse({proposed:[scaled,scaled,scaled,scaled],origins:[previous,previous,previous,previous],previous:old,wheel:0,wall:placeWall(fixtureData.walls[contact.wall],rotation,contact.wallRotation,contact.tileOrigin),distance,wallLower:contact.wallLower,wallUpper:contact.wallUpper,carRotation:[0,0,0],roadSpeed:30000,scaledRoadSpeed:30000,wheelAngle:0,soundFlags:0});
  assert.equal(response,null,'Divider-top wheel bypasses side wall throughout its length');checked++;
 }
}
console.log(checked+' divider-top selection/height-filter cases pass in both web engines; full-car passage is a separate gate');
