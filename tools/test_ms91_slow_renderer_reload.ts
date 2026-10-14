import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeReplayRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {replayVideoSettings} from '../lib/game/future-race-settings.ts';
import {createRaceOverlayMask} from '../lib/game/race-overlay-mask.ts';
for(const file of ['native-manual-race-runtime.ts','native-demo-runtime.ts']){
 assert.match(readFileSync(new URL('../lib/game/'+file,import.meta.url),'utf8'),/createRaceOverlayMaskRenderer\(\{physicsEngine:session.physicsEngine,framesPerSecond:session.framesPerSecond\}\)/);
}
const path=process.argv[2];if(!path)throw Error('Provide the original MS91 10Hz DEFAULT replay');
const original=readFileSync(path),{bytes,framesPerSecond}=decodeVersionedReplay(original,'ms-1991');assert.equal(framesPerSecond,10);
const menu={configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'SLOW',camera:0,graphics:2,soundEnabled:false},recording={bytes,name:'SLOW',path:'',physicsEngine:'ms-1991' as const,framesPerSecond};
// Private playback works without preview/future graphics settings. Its future
// engine remains legacy20Hz while the selected replay owns modern10Hz identity.
const sourceData={...fixtureData,physicsEngine:'ms-1990' as const,framesPerSecond:20 as const},host={resetMouse(){},async key(){return 27;}};
const data=replayVideoSettings(sourceData);
assert.equal(data.physicsEngine,'ms-1990');assert.equal(data.framesPerSecond,20);
for(const slow of [false,true]){
 const configured=replayVideoSettings(sourceData,{graphics:2,configuredFramesPerSecond:20,slowVideoManagement:slow});
 const control=await createNativeReplayRaceRuntime(data,menu,recording,host),modern=await createNativeReplayRaceRuntime(configured,menu,recording,host);
 for(const runtime of [control,modern]){assert.equal(runtime.session.physicsEngine,'ms-1991');assert.equal(runtime.session.framesPerSecond,10);runtime.enableGraphicsCapture();}
 for(const frame of [0,1,100,600,958]){
  for(const runtime of [control,modern]){runtime.session.seek(0);runtime.session.seek(frame);}
  assert.deepEqual(modern.renderCockpitWorld(),control.renderCockpitWorld(),'Loaded slow replay rendering follows its recorded rate at'+frame);
  const a=modern.graphicsFrame()!,b=control.graphicsFrame()!;assert.ok(a&&b);assert.ok(JSON.stringify(a.calls)===JSON.stringify(b.calls));assert.ok(Buffer.from(a.mask).equals(Buffer.from(b.mask)));
  if(frame===600){
   const before=a.memory.slice();
   const slowMask=createRaceOverlayMask(a.memory,a.memory,a.rectangle,a.fireballMask,{physicsEngine:'ms-1991',framesPerSecond:10}).slice();
   const fastMask=createRaceOverlayMask(a.memory,a.memory,a.rectangle,a.fireballMask,{physicsEngine:'ms-1991',framesPerSecond:20}).slice();
   assert.equal(slowMask.length,64000);assert.equal(fastMask.length,64000);
   assert.deepEqual(a.memory,before,'Overlay reconstruction must not mutate retained simulation memory');
  }
  assert.ok(Buffer.from(modern.session.state.memory).equals(Buffer.from(control.session.state.memory)));
  assert.equal(modern.session.state.memory[0x2d1a0+0x8018]&1,0,'Replay reload must not gain fresh-score eligibility');
 }
 assert.equal(modern.session.state.player.driving.car.grip.crash,3);assert.deepEqual(readFileSync(path),original);
 console.log(`10Hz recorded replay under20Hz future/menu defaults, management${slow}: load/rewind/render reaches original finish with matching pixels, enhanced output and state; no fresh-score eligibility`);
}
