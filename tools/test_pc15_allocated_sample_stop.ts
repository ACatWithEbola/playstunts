import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL');
for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const operation of ['effect','reset','car'] as const){
 const baseMemory=fixtureData.base.slice(),baseView=new DataView(baseMemory.buffer);baseView.setUint16(0x20,0x1234,true);baseView.setUint16(0x22,0x5678,true);
 const runtime=await createNativeManualRaceRuntime({...fixtureData,base:baseMemory,physicsEngine,soundDevice:{kind:'pc-speaker',port61:()=>0,sampleIo:{interruptMask:()=>0xa5}}},{configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'PCSTOP',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
 const memory=runtime.session.state.memory,d=0x2d1a0,v=new DataView(memory.buffer);
 const original={offset:v.getUint16(0x20,true),segment:v.getUint16(0x22,true)};
 const segment=v.getUint16(d+0x4dde,true),base=segment*16,modern=physicsEngine==='ms-1991',shift=modern?10:0;
 v.setUint16(base+0x2d3+shift,original.offset,true);v.setUint16(base+0x2d5+shift,original.segment,true);
 v.setUint16(0x20,modern?0x701:0x6dc,true);v.setUint16(0x22,segment,true);
 memory[base+0x1a8]=255;memory[base+0x2dd+shift]=0xa5;
 memory[d+0xa036]=16;memory[d+0xa037]=1;
 if(operation==='car'){
  memory[d+0xa037]=0; // Leave ownership for deferred cleanup, not voice decay.
  const car=d+0x618e;memory[car]=1;memory[car+1]=1;memory[car+27]=1;v.setUint16(car+20,16,true);
 }
 const stop=()=>operation==='effect'?runtime.audio.stopEffect(16):operation==='reset'?runtime.audio.dispatchRequests([{kind:'reset'}]):runtime.audio.tick();
 const writes=stop();
 assert.equal(memory[base+0x1a8],0);
 assert.deepEqual({offset:v.getUint16(0x20,true),segment:v.getUint16(0x22,true)},original,physicsEngine+' '+operation+' sample stop must restore live IRQ0');
 assert.ok(writes.some(([port,value])=>port===0x21&&value===0xa5));
 assert.equal(memory[d+0xa037],0);
 stop();
 assert.deepEqual({offset:v.getUint16(0x20,true),segment:v.getUint16(0x22,true)},original,'Repeated stop retains the restored vector');
 assert.ok('interrupt' in runtime.audio&&typeof runtime.audio.interrupt==='function');
 const interrupt=runtime.audio.interrupt as ()=>number[][];
 assert.doesNotThrow(()=>interrupt(),'Next interrupt returns to the ordinary callback');
}
console.log('Explicit stop, reset and deferred car cleanup restore live IRQ0 and retire samples in both editions');
