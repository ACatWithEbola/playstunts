import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {serviceSuppliedTandySilentRequests} from '../lib/game/supplied-tandy-bios.ts';
import {tandyDriverLayout} from '../lib/game/tandy-driver-layout.ts';

const bytes=readFileSync('public/game/replays/CTKFIN.RPL'),original=bytes.slice();
let cycles=0;
for(const driverGeneration of ['ms-1990','ms-1991'] as const){
 for(const physicsEngine of ['ms-1990','ms-1991'] as const){
  const device={kind:'tandy' as const,driverGeneration,port61:()=>0,interruptCx:()=>0,
   bios(requests:Parameters<typeof serviceSuppliedTandySilentRequests>[0],memory:Uint8Array){
    if(driverGeneration==='ms-1991')assert.equal(requests.length,0);
    else serviceSuppliedTandySilentRequests(requests,memory);
   }};
  const runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine,soundDevice:device},
   {configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'TDPause',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
  const memory=runtime.session.state.memory,d=0x2d1a0,v=new DataView(memory.buffer),driver=v.getUint16(d+0x4dde,true),layout=tandyDriverLayout(driverGeneration);
  assert.equal(driver,0x39e1);
  runtime.audio.produce();for(let i=0;i<100;i++)runtime.audio.tick();
  for(let cycle=0;cycle<20;cycle++){
   const volumes=Array.from({length:24},(_,i)=>memory[d+0x8046+i*72]);
   const sequence=Array.from({length:24},(_,i)=>memory.slice(d+0x801e+i*72,d+0x801e+i*72+40));
   const initialMusic=memory[d+0x4e03],initialSound=memory[d+0x4e05];
   for(const operation of ['pause-audio','resume-audio'] as const){
    const writes=runtime.dialogAudio(operation);
    if(driverGeneration==='ms-1991'&&operation==='pause-audio'&&
      memory[d+0xa036+5*46]<24&&
      (initialSound===1||memory[d+0xa036+5*46]<16)){
     assert(writes.some(([port,value])=>port===0x61&&(value&3)===0),'Modern dialog must immediately gate PC channel');
    }
    assert.equal(memory[d+0x4e02],operation==='pause-audio'?1:0);
    assert.equal(v.getUint16(d+0x4e0c,true),0,'Dialog must release audio guard');
    assert.equal(memory[d+0x4e03],initialMusic);assert.equal(memory[d+0x4e05],initialSound);
    for(let i=0;i<24;i++){
     assert.deepEqual(memory.slice(d+0x801e+i*72,d+0x801e+i*72+40),sequence[i],'Dialog must not restart sequence');
     if(initialSound===1||i<16)assert.equal(memory[d+0x8046+i*72],operation==='pause-audio'?0:volumes[i]);
    }
    assert.equal(memory.slice(driver*16,driver*16+layout.bytes).length,layout.bytes);
   }
   runtime.audio.tick();runtime.renderCockpitWorld();cycles++;
  }
  // Explicitly exercise owned inactive channel5: the original forwards volume
  // even for inactive records. A normally unowned slot must not be mistaken
  // for an invocation of the driver callback.
  const at=d+0xa036+5*46;memory[at]=16;memory[at+1]=0;
  const gated=runtime.dialogAudio('pause-audio');
  if(driverGeneration==='ms-1991')assert(gated.some(([port,value])=>port===0x61&&(value&3)===0));
  runtime.dialogAudio('resume-audio');
 }
}
assert.deepEqual(bytes,original);
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),original);
console.log(`${cycles} actual allocated Tandy pause/resume cycles pass across both sound-driver and physics generations; guards, settings, sequence positions, rendering and source replay preserved`);
