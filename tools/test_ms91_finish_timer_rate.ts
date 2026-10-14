import assert from 'node:assert/strict';
import {updateCrashState,type CrashRaceState} from '../lib/game/crash-state.ts';
const before:CrashRaceState={crash:0,speed:1000,roadSpeed:1000,yaw:0,abortFlag:0,timer:0,stats:[0,0,100,0,0,0,0,30,0,0,0],savedStats:Array(11).fill(0),elapsed:20,evaluationCause:0,replay:false,audioEnabled:false,preserveStats:false,audioHandles:[0,0]};
const original=structuredClone(before);
for(const cause of [1,2,3] as const){
 assert.deepEqual(updateCrashState(before,cause,0),updateCrashState(before,cause,0,20));
 for(const fps of [10,20] as const){
  const result=updateCrashState(before,cause,0,fps);
  assert.equal(result.state.timer,cause===3?fps:4*fps);
  if(cause===3)assert.equal(result.state.stats[3],150);
  const retained=Array.from({length:11},(_,i)=>300+i),playback={...before,preserveStats:true,savedStats:retained};
  const playbackBefore=structuredClone(playback),played=updateCrashState(playback,cause,0,fps);
  assert.deepEqual(played.state.savedStats,retained,'Replay finish/crash must retain the prior evaluation snapshot');
  assert.deepEqual(played.state.stats,result.state.stats,'Preserving evaluation must not suppress current replay event statistics');
  assert.deepEqual(playback,playbackBefore);
 }
}
assert.deepEqual(before,original);
console.log('Crash/finish delays scale with cadence; finish sums/default20 remain unchanged; replay evaluation snapshots stay preserved');
