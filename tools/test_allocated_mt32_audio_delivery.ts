import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import type {OriginalMt32MpuProgram} from '../lib/game/mt32-transport.ts';
import {createNativeDemoRuntime} from '../lib/game/native-demo-runtime.ts';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
const replay=readFileSync('public/game/replays/CTKFIN.RPL'),before=Buffer.from(replay);
function virtual(program:OriginalMt32MpuProgram){const writes:number[][]=[];let step=program.next();while(!step.done){if(step.value.kind==='write')writes.push([step.value.port,step.value.value]);step=program.next(0);}return {result:step.value,writes};}
const devices={mouse:()=>({x:160,y:100,buttons:0}),joystickSteering:()=>0,controls:()=>1,keyDown:()=>0};
for(const driverGeneration of ['ms-1990','ms-1991'] as const)for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const data={...fixtureData,physicsEngine,soundDevice:{kind:'mt32' as const,driverGeneration,execute:virtual}};
 const menu={configuration:Array.from(replay.subarray(0,24)),track:Array.from(replay.subarray(24,0x722)),name:'DELIVER',camera:0,graphics:2,soundEnabled:true};
 const regular=await createNativeManualRaceRuntime(data,menu,{resetMouse(){}}),timed=await createNativeManualRaceRuntime(data,menu,{resetMouse(){}});
 regular.session.skipIntroduction();timed.session.skipIntroduction();
 for(let i=0;i<100;i++){
  const expected=regular.tick(devices),delivered:number[][]=[];
  const trailing=await timed.tickWithAudioDelivery(devices,async writes=>{
   delivered.push(...writes);const memory=timed.session.state.memory.slice(),length=timed.session.length;
   await Promise.resolve();assert.deepEqual(timed.session.state.memory,memory);assert.equal(timed.session.length,length);
  });
  assert.deepEqual([...delivered,...trailing],expected);assert.deepEqual(timed.session.state.memory,regular.session.state.memory);assert.equal(timed.session.length,regular.session.length);
 }
 const length=timed.session.length;
 await assert.rejects(timed.tickWithAudioDelivery(devices,async()=>{throw Error('delivery failed');}),/delivery failed/);
 assert.equal(timed.session.length,length,'Failed delivery must not advance captured physics');
 const demoData={...data,demoReplay:versionedDemoResource(physicsEngine),experimental10Hz:true};
 const normalDemo=await createNativeDemoRuntime(demoData,menu),timedDemo=await createNativeDemoRuntime(demoData,menu);
 assert.equal(timedDemo.session.framesPerSecond,physicsEngine==='ms-1991'?10:20);
 for(let i=0;i<100;i++){
  const expected=normalDemo.tick(),delivered:number[][]=[];
  const trailing=await timedDemo.tickWithAudioDelivery(devices,async writes=>{delivered.push(...writes);const snapshot=timedDemo.session.state.memory.slice();await Promise.resolve();assert.deepEqual(timedDemo.session.state.memory,snapshot);});
  assert.deepEqual([...delivered,...trailing],expected);assert.deepEqual(timedDemo.session.state.memory,normalDemo.session.state.memory);assert.equal(timedDemo.frame,normalDemo.frame);
 }
}
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),before);
console.log('400 allocated Roland ticks retain complete memory, recorded frames and exact nonduplicated MIDI across both driver/physics versions; rejected delivery prevents physics advancement');
console.log('400 original demo ticks retain recorded 20Hz/10Hz cadence, complete memory/frame progression and nonduplicated MIDI through awaited delivery');
