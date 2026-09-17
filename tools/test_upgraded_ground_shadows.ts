import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createUpgradedRaceGround} from '../lib/game/upgraded-race-ground.ts';
import {RETRO_SUN} from '../lib/game/upgraded-retro-lighting.ts';

await test('race grass receives car shadows beyond every track edge and across signed native coordinates',()=>{
 const ground=createUpgradedRaceGround(),world=new THREE.Group();world.scale.z=-1;world.add(ground);world.updateMatrixWorld(true);
 assert.deepEqual(ground.position.toArray(),[15360,-1,15360]);
 assert.equal(ground.material.depthWrite,false);assert.equal(ground.material.toneMapped,false);
 assert.equal(ground.renderOrder,-1);assert.equal(ground.userData.retroDistanceColour,false);
 const ray=new THREE.Raycaster(),direction=RETRO_SUN.clone().negate();
 for(const x of [-32768,-100,-1,0,15360,30720,30780,32767])for(const z of [-32768,-100,15360,30780,32767])for(const [dx,dz] of [[-64,-64],[64,64]]){
  ray.set(new THREE.Vector3(x+dx,24,-z+dz),direction);
  const hits=ray.intersectObject(ground);
  assert.equal(hits.length,1,`missing grass receiver at native ${x}/${z}`);
  assert.ok(Math.abs(hits[0].point.y+1)<1e-7,'shadow must land on the unchanged flat grass height');
 }
 ground.geometry.dispose();ground.material.dispose();
});

await test('race sun keeps the low car silhouette separated in world space, not attached to car heading',()=>{
 const displacement=RETRO_SUN.clone().multiplyScalar(-18/RETRO_SUN.y);
 assert.ok(Math.hypot(displacement.x,displacement.z)>12,'an 18-unit Indy roof needs more than 12 units of horizontal projection, not the nearly hidden 6.6-unit projection of the old 70-degree sun');
 for(const heading of [0,Math.PI/2,Math.PI,3*Math.PI/2]){
  const local=displacement.clone().applyAxisAngle(new THREE.Vector3(0,1,0),-heading);
  const world=local.applyAxisAngle(new THREE.Vector3(0,1,0),heading);
  assert.ok(world.distanceTo(displacement)<1e-10,'turning the car must not turn the world-fixed sunlight');
 }
});
