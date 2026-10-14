import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {loadAllocatedReplay} from '../lib/game/allocated-replay-load.ts';
import type {OriginalMt32MpuProgram} from '../lib/game/mt32-transport.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL');
function virtual(program:OriginalMt32MpuProgram){const writes:number[][]=[];let step=program.next();while(!step.done){if(step.value.kind==='write')writes.push([step.value.port,step.value.value]);step=program.next(0);}return {result:step.value,writes};}
for(const driverGeneration of ['ms-1990','ms-1991'] as const){
 const data={...fixtureData,physicsEngine:'ms-1991' as const,soundDevice:{kind:'mt32' as const,driverGeneration,execute:virtual}};
 let runtime=await createNativeManualRaceRuntime(data,{configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'MTGEN',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
 for(const replayEngine of ['ms-1990','ms-1991'] as const){
  const replacement=await loadAllocatedReplay(data,runtime,{async selectReplay(){return 1;},async readReplay(){return bytes.slice();},replayPhysicsEngine:()=>replayEngine,replayFramesPerSecond:()=>20,showWaiting(){},progress(){},writeAudio(){}});assert.ok(replacement);runtime=replacement;
  const memory=runtime.session.state.memory,d=0x2d1a0,v=new DataView(memory.buffer),handle=v.getUint16(d+0x8016,true);
  memory[d+0x618e+handle*76+1]=0; // Explicit isolated engine-start probe after replay initialization.
  const writes=runtime.audio.start(handle);assert.equal(writes.some(([port,value])=>port===0x330&&value===0xf0),driverGeneration==='ms-1991');
  runtime.renderCockpitWorld();
 }
}
console.log('Explicit Roland boot generation survives both replay physics replacements; allocated startup/render passes with virtual timing responses only');
