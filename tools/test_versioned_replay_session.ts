import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeReplayRaceSession} from '../lib/game/native-manual-race-session.ts';
import {importVersionedReplay} from '../lib/game/versioned-replay-file.ts';
const [path]=process.argv.slice(2);if(!path)throw Error('Usage: node tools/test_versioned_replay_session.ts BB11_REPLAY');
const source=new Uint8Array(readFileSync(path));
const bytes=importVersionedReplay(source,'bb-1991');
const frames=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint16(22,true);
const menu={configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'TEST',camera:0,graphics:2,soundEnabled:false};
const host={resetMouse(){},async key(){return 0;}};
for(const physicsEngine of ['bb-1991','ms-1991'] as const){
 const modern=await createNativeReplayRaceSession(fixtureData,menu,{bytes,name:'TEST',path:'C:\\',physicsEngine},host);
 assert.equal(modern.session.physicsEngine,physicsEngine);
 assert.equal(modern.session.framesPerSecond,20);
 for(const target of [...new Set([Math.min(50,frames),Math.min(1000,frames),frames])]){
  modern.session.seek(target);
  const car=structuredClone(modern.session.state.player.driving.car);
  modern.session.seek(0);modern.session.seek(target);
  assert.deepEqual(modern.session.state.player.driving.car,car,'Replay rewind must preserve the complete car state at '+target);
  assert.equal(modern.session.physicsEngine,physicsEngine);
 }
 assert.equal(modern.session.physicsEngine,physicsEngine);
 const legacy=await createNativeReplayRaceSession({...fixtureData,physicsEngine,framesPerSecond:10},menu,{bytes,name:'OLD',path:'C:\\'},host);
 assert.equal(legacy.session.physicsEngine,'ms-1990');
 assert.equal(legacy.session.framesPerSecond,20,'Untagged old recording must not inherit fresh-race cadence');
 assert.equal(modern.session.physicsEngine,physicsEngine);
}
assert.deepEqual(new Uint8Array(readFileSync(path)),source,'Source replay must remain unchanged');
console.log('Replay sessions independently select tagged engines; untagged playback remains legacy.');
