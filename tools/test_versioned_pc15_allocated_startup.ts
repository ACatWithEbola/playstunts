import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {loadAllocatedReplay} from '../lib/game/allocated-replay-load.ts';
import {loadedPc15Generation} from '../lib/game/loaded-pc15-generation.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL'),original=bytes.slice();
const soundDevice={kind:'pc-speaker' as const,port61:()=>0};
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const data={...fixtureData,physicsEngine,soundDevice};
 let runtime=await createNativeManualRaceRuntime(data,{configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'PC15QA',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
 assert.equal(loadedPc15Generation(runtime.session.state.memory,0x2d1a0),physicsEngine);
 runtime.session.skipIntroduction();runtime.renderCockpitWorld();
 for(const replayEngine of ['ms-1991','ms-1990'] as const){
  const replacement=await loadAllocatedReplay(data,runtime,{async selectReplay(){return 1;},async readReplay(){return bytes.slice();},replayPhysicsEngine:()=>replayEngine,replayFramesPerSecond:()=>20,showWaiting(){},progress(){},writeAudio(){}});
  assert.ok(replacement);runtime=replacement;
  assert.equal(runtime.session.physicsEngine,replayEngine);
  assert.equal(loadedPc15Generation(runtime.session.state.memory,0x2d1a0),physicsEngine,'Replay replacement must retain boot sound generation');
  runtime.session.seek(0);runtime.renderCockpitWorld();
 }
 assert.deepEqual(bytes,original);
}
console.log('Allocated PC15 startup/replay reload retains boot driver across both physics engines; replay bytes unchanged, silent output');
