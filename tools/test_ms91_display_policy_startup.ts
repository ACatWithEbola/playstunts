import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {prepareNativeDisplayRace} from '../lib/game/prepare-native-display-race.ts';
import {decodeNativeInitialDisplayData} from '../lib/game/browser-native-display-race.ts';
import {prepareOriginalRaceViewport} from '../lib/game/race-viewport.ts';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
const {bytes,framesPerSecond}=versionedDemoResource('ms-1991')!,packet=JSON.parse(readFileSync('public/game/native-initial-data.json','utf8'));
const race=await createNativeManualRaceSession({...fixtureData,physicsEngine:'ms-1991',framesPerSecond,experimental10Hz:true},{configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'DISPLAY',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});race.session.skipIntroduction();
const snapshots=[race.session.state.memory.slice()];
for(let frame=0;frame<bytes.length-0x722;frame++){
 captureOriginalRaceInput(race.session.state.memory,0x2d1a0,bytes[0x722+frame],framesPerSecond);race.session.originalMemory.writeMemory(race.session.state.memory);race.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});
 if(frame%50===0||frame===bytes.length-0x723)snapshots.push(race.session.state.memory.slice());
}
assert.equal(race.session.state.player.driving.car.grip.crash,3);
const unchanged=race.session.state.memory.slice(),sourceChecks=snapshots.map(memory=>memory.slice());
for(const mode of ['cga','tandy','ega'] as const){
 const variants=await Promise.all([undefined,false,true].map(experimentalMs91SlowVideoManagement=>prepareNativeDisplayRace({...fixtureData,physicsEngine:'ms-1991',framesPerSecond,experimentalMs91SlowVideoManagement},mode,decodeNativeInitialDisplayData(packet.modes[mode]),race.session.state.memory,race.raw)));
 for(let frame=0;frame<snapshots.length;frame++){
  const live=snapshots[frame].slice();prepareOriginalRaceViewport(live,0x2d1a0,0xeefe);live[0x2d1a0+0x9ab6]=frame===0?1:0;
  const expected=variants[0].renderer.render(live.slice()).slice();
  for(const variant of variants.slice(1))assert.deepEqual(variant.renderer.render(live.slice()),expected,mode+' prepared video-policy frame'+frame);
 }
 if(mode!=='ega'){assert.ok(variants[2].renderer.experimentalPartialBackgroundPasses>0);assert.ok(variants[2].renderer.experimentalRenderWindowCaptures>0);assert.ok(variants[2].renderer.experimentalRenderWindowCaptures<snapshots.length);}
 for(const slow of [false,true,false,true]){
  variants[2].renderer.setMs91VideoManagement(slow);
  for(let frame=1;frame<5;frame++){
   const live=snapshots[frame].slice();prepareOriginalRaceViewport(live,0x2d1a0,0xeefe);live[0x2d1a0+0x9ab6]=0;
   const control=live.slice();control[0x2d1a0+0x9ab6]=frame===1?1:0;
   const expected=variants[0].renderer.render(control).slice();
   assert.deepEqual(variants[2].renderer.render(live.slice()),expected,mode+' changed video policy '+slow+' sample '+frame);
  }
 }
 console.log(mode+': prepared display graph forwards both MS91 video policies with matching'+snapshots.length+' raster samples through original10Hz demo finish');
}
assert.deepEqual(race.session.state.memory,unchanged);snapshots.forEach((memory,index)=>assert.deepEqual(memory,sourceChecks[index]));
