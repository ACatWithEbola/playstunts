import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeOriginalMt32Memory} from '../lib/game/initialize-mt32-memory.ts';
import {versionedMt15Resource} from '../lib/game/versioned-mt15-resource.ts';
import {executeTimedMt32Program} from '../lib/game/timed-mt32-program.ts';
import {readOriginalMt32RaceState} from '../lib/game/mt32-race-audio-memory.ts';
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const memory=new Uint8Array(0x100000),d=0x60000,driverSegment=0x8000;
 const driver=versionedMt15Resource(physicsEngine)??readFileSync('public/game/original-resources/MT15.DRV');memory.set(driver,driverSegment*16);
 memory.set([1,0,0,0,0,0,0,0,0],0x90000);let loads=0,frees=0;const writes:number[][]=[];
 const result=await initializeOriginalMt32Memory(memory,d,driverSegment,{
  execute(program){return executeTimedMt32Program(program,{read:()=>0,write(port,value){writes.push([port,value]);},interrupts(){},delay(){},cancelled:()=>false});},
  async loadPatch(){loads++;return {offset:0,segment:0x9000};},freePatch(pointer){assert.deepEqual(pointer,{offset:0,segment:0x9000});frees++;},
 },physicsEngine);
 assert.equal(result,0);assert.equal(loads,1);assert.equal(frees,1);
 assert.equal(memory[d+0x9fe4],16);assert.equal(memory[d+0x4e06],1);assert.equal(memory[d+0x4e0c],0);
 const state=readOriginalMt32RaceState(memory,d,driverSegment,physicsEngine);assert.equal(state.driver.length,driver.length);assert.equal(state.physicsEngine,physicsEngine);
 assert.equal(writes.some(([port])=>port===0x42),physicsEngine==='ms-1991');assert.ok(writes.some(([port,value])=>port===0x330&&value===0xf7));
}
console.log('Both allocated Roland generations initialize/reset/upload/free/configure in order, explicit virtual responses only; elapsed timing not tested');
