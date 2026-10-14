import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
const source=readFileSync(new URL('../public/game/replays/CTKFIN.RPL',import.meta.url));
const menu={configuration:Array.from(source.slice(0,24)),track:Array.from(source.slice(24,0x722)),name:'RUNTIME',camera:0,graphics:2,soundEnabled:false};
for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const slow of [false,true]){
 const control=await createNativeManualRaceRuntime({...fixtureData,physicsEngine},menu,{resetMouse(){}});
 const modern=await createNativeManualRaceRuntime({...fixtureData,physicsEngine,experimentalMs91SlowVideoManagement:slow},menu,{resetMouse(){}});
 for(const runtime of [control,modern]){runtime.session.skipIntroduction();runtime.enableGraphicsCapture();}
 assert.deepEqual(modern.renderWorld(),control.renderWorld(),'Existing world-only runtime entry remains usable under both policies');
 for(let frame=0;frame<8;frame++){
  if(frame)for(const runtime of [control,modern])runtime.session.tick(2);
  const expected=control.renderCockpitWorld().slice(),actual=modern.renderCockpitWorld().slice();
  assert.deepEqual(actual,expected,`${physicsEngine} management${slow} runtime frame${frame}`);
  const a=modern.graphicsFrame()!,b=control.graphicsFrame()!;assert.ok(a&&b);
  assert.deepEqual(a.calls,b.calls,'Runtime enhanced geometry remains identical');assert.deepEqual(a.wheels,b.wheels);assert.deepEqual(a.mask,b.mask,'Runtime enhanced overlay mask remains identical');
  assert.deepEqual(modern.session.state.memory,control.session.state.memory,'Rendering policy cannot change simulation state');
 }
 if(physicsEngine==='ms-1991'){
  for(const policy of [!slow,slow,!slow]){
   const snapshot=modern.session.state.memory.slice();
   modern.setMs91VideoManagement(policy);
   assert.deepEqual(modern.session.state.memory,snapshot,'Policy switch does not write simulation memory');
   for(let frame=0;frame<3;frame++){
    for(const runtime of [control,modern])runtime.session.tick(2);
    assert.deepEqual(modern.renderCockpitWorld(),control.renderCockpitWorld(),'Changed policy reseeds retained pixels');
    const actual=modern.graphicsFrame()!,expected=control.graphicsFrame()!;
    assert.deepEqual(actual.mask,expected.mask);assert.deepEqual(actual.calls,expected.calls);
    assert.deepEqual(modern.session.state.memory,control.session.state.memory);
    assert.equal(modern.session.framesPerSecond,control.session.framesPerSecond);
   }
  }
 }else assert.throws(()=>modern.setMs91VideoManagement(true),/allocated MS91/);
 console.log(`${physicsEngine} management${slow}: actual manual runtime forwards retained-copy hooks, preserves enhanced capture and matches default pixels/state over8 frames`);
}
