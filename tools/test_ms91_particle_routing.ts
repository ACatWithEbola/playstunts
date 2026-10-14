import assert from 'node:assert/strict';
import {generateParticles,advanceParticles,type Particles} from '../lib/game/particles.ts';
import {crashOriginalRaceMemory} from '../lib/game/crash-race-memory.ts';
import {readPlayerDrivingState} from '../lib/game/initialized-player-driving.ts';
const particles:Particles={random:[255,255,255,255,255,255],active:0,particles:Array.from({length:24},()=>({x:0,y:0,z:0,angleX:0,angleZ:0,heading:0,speed:0,verticalSpeed:0,style:0,owner:0}))};
const snapshot=structuredClone(particles);
assert.deepEqual(generateParticles(particles,0,768,0),generateParticles(particles,0,768,0,'ms-1990'));
assert.notDeepEqual(generateParticles(particles,0,768,0,'ms-1991'),generateParticles(particles,0,768,0));
assert.deepEqual(particles,snapshot);
const moving=generateParticles(particles,0,768,0,'ms-1991');
assert.deepEqual(advanceParticles(moving,10000),advanceParticles(moving,10000,20));
const fast=advanceParticles(moving,10000,20),slow=advanceParticles(moving,10000,10);
for(let i=0;i<24;i++){
 if(!moving.particles[i].speed)continue;
 assert.equal(slow.particles[i].x,fast.particles[i].x);assert.equal(slow.particles[i].z,fast.particles[i].z);
 assert.equal(slow.particles[i].verticalSpeed,fast.particles[i].verticalSpeed-19);
 assert.equal(slow.particles[i].y,fast.particles[i].y+slow.particles[i].verticalSpeed);
}
for(const selected of [0,1] as const){
 const seed=new Uint8Array(65536),v=new DataView(seed.buffer);
 seed.set(particles.random,0x9f5c);v.setUint16(0x8c38+selected*0xb8+0x18,768,true);
 const expected=generateParticles(readPlayerDrivingState(seed).driving.particles,selected,768,0,'ms-1991');
 const modern=seed.slice();crashOriginalRaceMemory(modern,0,1,selected,20,'ms-1991');
 assert.deepEqual(readPlayerDrivingState(modern).driving.particles,expected,'Direct MS91 crash writes versioned debris for car '+selected);
 const implicit=seed.slice(),explicit=seed.slice();
 crashOriginalRaceMemory(implicit,0,1,selected);crashOriginalRaceMemory(explicit,0,1,selected,20,'ms-1990');
 assert.deepEqual(implicit,explicit,'Legacy crash memory remains identical');
}
console.log('MS91 direct crash particle routing matches the versioned generator; legacy memory and input preservation pass');
