import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import type {OriginalMt32MpuProgram} from '../lib/game/mt32-transport.ts';
// Explicit virtual host: ready MPU and synthetic PIT countdown. This checks
// state/callback integration, not physical device readiness or elapsed timing.
function executeVirtualProgram(program:OriginalMt32MpuProgram){
 let counter=65535,high=false,port61=0,steps=0,step=program.next();const writes:number[][]=[];
 while(!step.done){
  assert.ok(++steps<1000000,'Virtual transport must terminate');
  const op=step.value;let value=0;
  if(op.kind==='write'){
   writes.push([op.port,op.value]);if(op.port===0x61)port61=op.value;
   if(op.port===0x43&&op.value===0xb6){counter=65535;high=false;}
   if(op.port===0x43&&op.value===0x80)counter=Math.max(0,counter-1024);
  }else if(op.kind==='read'){
   if(op.port===0x330)value=0xfe;
   else if(op.port===0x61)value=port61;
   else if(op.port===0x42){value=high?counter>>>8:counter&255;high=!high;}
  }
  step=program.next(value);
 }
 return {result:step.value,writes};
}
const bytes=readFileSync('public/game/replays/CTKFIN.RPL'),before=bytes.slice();let callbacks=0,races=0;
for(const kind of ['adlib','mt32'] as const)for(const driverGeneration of ['ms-1990','ms-1991'] as const)for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const car of ['ANSX','AUDI','COUN','FGTO','JAGU','LANC','LM02','P962','PC04','PMIN','VETT']){
 const configuration=Array.from(bytes.subarray(0,24));configuration.splice(0,4,...Array.from(car,c=>c.charCodeAt(0)));
 const soundDevice=kind==='mt32'?{kind,driverGeneration,execute:executeVirtualProgram,executeInitialization:async(program:OriginalMt32MpuProgram)=>executeVirtualProgram(program)}:{kind,driverGeneration};
 const runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine,soundDevice},{configuration,track:Array.from(bytes.subarray(24,0x722)),name:'SoundQA',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
 const memory=runtime.session.state.memory,d=0x2d1a0,v=new DataView(memory.buffer),handle=v.getUint16(d+0x8016,true);
 runtime.audio.start(handle);runtime.audio.crash(handle);
 for(let i=0;i<200;i++){runtime.audio.tick();callbacks++;}
 assert.equal(memory[d+0x4e6a],0,`${kind}/${driverGeneration}/${physicsEngine}/${car}: reentry guard cleared`);races++;
}
assert.equal(races,88);assert.equal(callbacks,17600);assert.deepEqual(bytes,before);
console.log('PASS88 actual allocated AdLib/MT32 races, all11 cars and all core/driver combinations;17600 active engine/crash callbacks; replay unchanged, no physical audio');
