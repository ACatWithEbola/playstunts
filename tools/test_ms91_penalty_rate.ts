import assert from 'node:assert/strict';
import {playerRouteProgress,type PlayerRouteProgress} from '../lib/physics/player-route-progress.ts';
const before:PlayerRouteProgress={status:0,confirmations:2,route:1,lastRoute:1,laps:0,lastPenalty:0,penaltyDisplay:0,totalPenalty:65500};
const original=structuredClone(before),primary=[0,2,0],alternate=[0,2,0];
for(const delta of [4,100,32767]){
 const normal=playerRouteProgress(before,true,2,delta,primary,alternate);
 assert.deepEqual(normal,playerRouteProgress(before,true,2,delta,primary,alternate,20));
 for(const fps of [10,20] as const){
  const next=playerRouteProgress(before,true,2,delta,primary,alternate,fps);
  assert.equal(next.lastPenalty,(3*fps*delta)&65535);
  assert.equal(next.penaltyDisplay,4*fps);
  assert.equal(next.totalPenalty,(65500+next.lastPenalty)&65535);
  assert.equal(next.confirmations,0);
 }
}
assert.deepEqual(before,original);
console.log('Route penalty/display durations scale with cadence; signed-word wrapping and default20 preserved');
