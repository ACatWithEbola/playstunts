import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {advanceAllocatedRaceWithAudioWait} from '../lib/game/advance-allocated-race.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL'),original=bytes.slice();
const devices={mouse:()=>({x:160,y:100,buttons:0}),joystickSteering:()=>0,controls:()=>1,keyDown:()=>0};
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const data={...fixtureData,physicsEngine};
 const options={configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'WAIT',camera:0,graphics:2,soundEnabled:true};
 const regular=await createNativeManualRaceRuntime(data,options,{resetMouse(){}});
 const waiting=await createNativeManualRaceRuntime(data,options,{resetMouse(){}});
 regular.session.skipIntroduction();waiting.session.skipIntroduction();
 for(let tick=0;tick<100;tick++){
  const expected=regular.tick(devices);
  const actual=await waiting.tickWithAudioWait(devices,async()=>{
   const snapshot=waiting.session.state.memory.slice(),length=waiting.session.length;
   await Promise.resolve();assert.deepEqual(waiting.session.state.memory,snapshot);assert.equal(waiting.session.length,length);
   return waiting.audio.tick();
  });
  assert.deepEqual(actual,expected);assert.deepEqual(waiting.session.state.memory,regular.session.state.memory);assert.equal(waiting.session.length,regular.session.length);
 }
 const caller={entryStackPointer:0xeefe-0x1c,incomingSI:0};
 let release!:(writes:number[][])=>void;
 const pending=advanceAllocatedRaceWithAudioWait(waiting.session,waiting.audio,devices,caller,()=>new Promise(resolve=>{release=resolve;}));
 const during=waiting.session.state.memory.slice(),length=waiting.session.length;
 const forbiddenExitHost=new Proxy({} as Parameters<typeof waiting.finish>[0],{get(){assert.fail('Pending callback shutdown cannot touch exit host or free resources');}});
 await assert.rejects(waiting.finish(forbiddenExitHost),/overlaps pending audio/);
 assert.throws(()=>waiting.tick(devices),/overlaps/);
 await assert.rejects(advanceAllocatedRaceWithAudioWait(waiting.session,waiting.audio,devices,caller,async()=>[]),/overlaps/);
 assert.deepEqual(waiting.session.state.memory,during);assert.equal(waiting.session.length,length);
 release(waiting.audio.tick());await pending;
 await assert.rejects(advanceAllocatedRaceWithAudioWait(waiting.session,waiting.audio,devices,caller,async()=>{throw Error('Sound owner failure');}),/Sound owner failure/);
 assert.doesNotThrow(()=>waiting.tick(devices),'Failure releases pending tick ownership');
 let releaseReplaced!:(writes:number[][])=>void;
 const replaced=advanceAllocatedRaceWithAudioWait(waiting.session,waiting.audio,devices,caller,()=>new Promise(resolve=>{releaseReplaced=resolve;}));
 const replacement=waiting.session.state.memory.slice();
 waiting.session.originalMemory.writeMemory(replacement);
 const replacementLength=waiting.session.length,beforeResume=replacement.slice();
 releaseReplaced([]);
 await assert.rejects(replaced,/memory replaced/);
 assert.equal(waiting.session.state.memory,replacement);assert.deepEqual(replacement,beforeResume);
 assert.equal(waiting.session.length,replacementLength,'Old waiting callback cannot advance replacement race');
 assert.doesNotThrow(()=>waiting.tick(devices),'Rejected old callback releases session ownership');
}
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),original);
console.log('Both editions: 100 serialized audio-wait ticks match synchronous writes, full game memory and recorded frame count; no race advancement during wait, source replay unchanged');
