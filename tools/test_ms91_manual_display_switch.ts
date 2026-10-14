import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {prepareNativeManualDisplay} from '../lib/game/native-manual-display.ts';
import {decodeNativeInitialDisplayData} from '../lib/game/browser-native-display-race.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL'),packet=JSON.parse(readFileSync('public/game/native-initial-data.json','utf8'));
const menu={configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'SWITCH',camera:0,graphics:2,soundEnabled:false};
for(const mode of ['cga','tandy','ega'] as const){
 const runtimes=await Promise.all([false,true].map(async slow=>{
  const data={...fixtureData,physicsEngine:'ms-1991' as const,experimentalMs91SlowVideoManagement:slow};
  const runtime=await createNativeManualRaceRuntime(data,menu,{resetMouse(){}});
  runtime.session.skipIntroduction();
  const prepared=await prepareNativeManualDisplay(data,mode,decodeNativeInitialDisplayData(packet.modes[mode]),()=>runtime.session.state.memory);
  runtime.useDisplay(prepared.display);runtime.enableGraphicsCapture();return runtime;
 }));
 const [control,changed]=runtimes;
 for(const slow of [true,false,true,false]){
  const snapshot=changed.session.state.memory.slice();
  changed.setMs91VideoManagement(slow);
  assert.deepEqual(changed.session.state.memory,snapshot,'Switch must not write live simulation');
  for(let frame=0;frame<4;frame++){
   for(const runtime of runtimes){runtime.session.tick(2);runtime.session.state.memory[0x2d1a0+0x9ab6]=frame===0?1:0;}
   const actual=changed.renderCockpitWorld(),expected=control.renderCockpitWorld();
   assert.ok(Buffer.from(actual).equals(Buffer.from(expected)),mode+' switched native pixels policy '+slow+' frame '+frame+' first difference '+actual.findIndex((value,i)=>value!==expected[i]));
   const a=changed.graphicsFrame()!,b=control.graphicsFrame()!;
   assert.deepEqual(a.calls,b.calls,mode+' enhanced geometry');assert.deepEqual(a.mask,b.mask,mode+' enhanced overlay');
   assert.deepEqual(changed.session.state.memory,control.session.state.memory,mode+' simulation state');
   assert.equal(changed.session.physicsEngine,'ms-1991');assert.equal(changed.session.framesPerSecond,20);
  }
 }
 console.log(mode+': manual runtime switches both renderers four times; native/enhanced output, engine, cadence and state match control');
}
