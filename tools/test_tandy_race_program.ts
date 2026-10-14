import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {createNativeDemoRuntime} from '../lib/game/native-demo-runtime.ts';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL');
const devices={mouse:()=>({x:160,y:100,buttons:0}),joystickSteering:()=>0,controls:()=>1,keyDown:()=>0};
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const data={...fixtureData,physicsEngine,soundDevice:{kind:'tandy' as const,driverGeneration:'ms-1991' as const,port61:()=>0,interruptCx:()=>0,bios(){assert.fail('Unexpected BIOS work');},sampleStarts(){assert.fail('Built-in tone banks cannot request samples');}}};
 const options={configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'PROGRAM',camera:0,graphics:2,soundEnabled:true};
 const regular=await createNativeManualRaceRuntime(data,options,{resetMouse(){}}),cooperative=await createNativeManualRaceRuntime(data,options,{resetMouse(){}});
 regular.session.skipIntroduction();cooperative.session.skipIntroduction();
 for(let tick=0;tick<100;tick++){
  const writes=regular.tick(devices),step=cooperative.tickProgram(devices).next();assert.equal(step.done,true);
  if(!step.done)throw Error('Tone-only race unexpectedly suspended');
  assert.deepEqual(step.value.writes,writes);assert.deepEqual(step.value.bios,[]);
  assert.deepEqual(cooperative.session.state.memory,regular.session.state.memory);assert.equal(cooperative.session.length,regular.session.length);
 }
 const demoData={...data,experimental10Hz:true,demoReplay:versionedDemoResource(physicsEngine)};
 const regularDemo=await createNativeDemoRuntime(demoData,options),programDemo=await createNativeDemoRuntime(demoData,options);
 for(let tick=0;tick<100;tick++){
  const writes=regularDemo.tick(),step=programDemo.tickProgram().next();assert.equal(step.done,true);
  if(!step.done)throw Error('Tone-only demo unexpectedly suspended');
  assert.deepEqual(step.value.writes,writes);assert.deepEqual(step.value.bios,[]);
  assert.deepEqual(programDemo.session.state.memory,regularDemo.session.state.memory);assert.equal(programDemo.frame,regularDemo.frame);
 }
 if(physicsEngine==='ms-1991'){
  for(let tick=0;tick<20000&&regularDemo.frame<regularDemo.length;tick++){
   const writes=regularDemo.tick(),step=programDemo.tickProgram().next();assert.equal(step.done,true);
   if(!step.done)throw Error('Built-in demo unexpectedly requests sampled continuation');
   assert.deepEqual(step.value.writes,writes);
   const exit=regularDemo.finishFrame(0,0);assert.equal(programDemo.finishFrame(0,0),exit);
   if(tick%100===0)assert.deepEqual(programDemo.session.state.memory,regularDemo.session.state.memory);
   if(exit==='exit')break;
  }
  assert.equal(regularDemo.session.state.player.driving.car.grip.crash,3);
  assert.deepEqual(programDemo.session.state.memory,regularDemo.session.state.memory);
  const cleanup:string[][]=[];
  for(const demo of [regularDemo,programDemo]){
   let counter=0;const events:string[]=[];cleanup.push(events);
   const restored=await demo.finish({writeAudio(){},async gameCounter(){return counter+=100;},async releaseInput(){events.push('release');},showWaiting(){events.push('waiting');},copyBackBuffer(){events.push('copy');},resetMouse(){events.push('mouse');}});
   assert.deepEqual(restored.configuration,options.configuration);assert.deepEqual(restored.track,options.track);
  }
  assert.deepEqual(cleanup,[['copy','mouse','release','waiting'],['copy','mouse','release','waiting']]);
 }
}
console.log('Full interrupt-driven race program matches synchronous Tandy ticks for 100 ticks in each physics edition: all writes, live memory and recorded frame count');
