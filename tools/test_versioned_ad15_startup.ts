import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {loadAllocatedReplay} from '../lib/game/allocated-replay-load.ts';
import {versionedAd15Resource} from '../lib/game/versioned-ad15-resource.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL'),original=bytes.slice();
assert.equal(createHash('sha256').update(versionedAd15Resource('ms-1991')!).digest('hex'),'e32b44c8ee6bf2046fc93359c225f3d99e559c94926594f6e3468e1c317afe26');
for(const driverGeneration of ['ms-1990','ms-1991'] as const){
 const data={...fixtureData,physicsEngine:'ms-1991' as const,soundDevice:{kind:'adlib' as const,driverGeneration}};
 let runtime=await createNativeManualRaceRuntime(data,{configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'ADGEN',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
 assert.ok(runtime.initialWrites.length>0);
 for(const replayEngine of ['ms-1990','ms-1991'] as const){
  const replacement=await loadAllocatedReplay(data,runtime,{async selectReplay(){return 1;},async readReplay(){return bytes.slice();},replayPhysicsEngine:()=>replayEngine,replayFramesPerSecond:()=>20,showWaiting(){},progress(){},writeAudio(){}});assert.ok(replacement);runtime=replacement;
  runtime.audio.produce();for(let frame=0;frame<100;frame++)runtime.audio.tick();runtime.renderCockpitWorld();
  assert.equal(runtime.session.physicsEngine,replayEngine);assert.deepEqual(bytes,original);
 }
}
console.log('Explicit AdLib driver startup/checksum, both replay physics reloads and400 audio callbacks pass silently; physical timing/discovery not tested');
