import assert from 'node:assert/strict';
import {test} from 'node:test';
import {resolvePhysicsEngine,scaleSteeringWord,LEGACY_PHYSICS,BB11_PHYSICS,MS91_PHYSICS} from '../lib/physics/engine-version.ts';
import {engineForceDelta} from '../lib/physics/engine.ts';
test('untagged recordings remain legacy and unknown versions fail closed',()=>{
 assert.equal(resolvePhysicsEngine(undefined),LEGACY_PHYSICS);
 assert.equal(resolvePhysicsEngine(null),LEGACY_PHYSICS);
 assert.equal(resolvePhysicsEngine(BB11_PHYSICS),BB11_PHYSICS);
 assert.equal(resolvePhysicsEngine(MS91_PHYSICS),MS91_PHYSICS);
 assert.throws(()=>resolvePhysicsEngine('latest'));
});
test('acceleration scaling retains legacy division and BB11 signed shifts',()=>{
 for(const mass of [800,1200,1500])for(let force=-32768;force<=32767;force++){
  const quotient=((Math.floor((Math.imul(force,25)>>>0)/mass)<<16)>>16);
  assert.equal(engineForceDelta(force,mass,LEGACY_PHYSICS),Math.trunc(quotient/2)|0);
  assert.equal(engineForceDelta(force,mass,BB11_PHYSICS),quotient>>1);
  assert.equal(engineForceDelta(force,mass,MS91_PHYSICS),quotient>>1);
 }
});
test('explicit steering modes preserve signed-word rounding without global state',()=>{
 for(let word=-32768;word<=32767;word++)for(const shift of [1,2,4]){
  assert.equal(scaleSteeringWord(word,shift,LEGACY_PHYSICS),Math.trunc(word/2**shift));
  assert.equal(scaleSteeringWord(word,shift,BB11_PHYSICS),Math.floor(word/2**shift));
  assert.equal(scaleSteeringWord(word,shift,MS91_PHYSICS),Math.floor(word/2**shift));
 }
 assert.equal(scaleSteeringWord(-1,2,BB11_PHYSICS),-1);
 assert.equal(scaleSteeringWord(-1,2,LEGACY_PHYSICS),Math.trunc(-1/4));
 assert.throws(()=>scaleSteeringWord(1,16));
});
