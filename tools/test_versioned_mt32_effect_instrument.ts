import assert from 'node:assert/strict';
import {stepOriginalMt32Effects} from '../lib/game/mt32-effect-runtime.ts';
import {startOriginalMt32Engine} from '../lib/game/mt32-engine-start.ts';
for(const physicsEngine of [undefined,'ms-1990','ms-1991'] as const){
 const timers=Array.from({length:24},()=>new Uint8Array(72)),voices=Array.from({length:16},()=>new Uint8Array(46));
 const timer=new DataView(timers[16].buffer);timer.setUint16(0,1,true);timer.setUint16(2,0x9000,true);timer.setUint16(0x2e,0x107,true);timer.setUint16(0x30,0x8000,true);
 const patch=new Uint8Array(100);patch[18]=12;patch[67]=1;patch[68]=5;patch[69]=77;patch[70]=64;
 const header=new Uint8Array(17);header[6]=1;new DataView(header.buffer).setUint16(7,0x200,true);new DataView(header.buffer).setUint16(9,0x8000,true);
 const resources=[{headerOffset:0x100,headerSegment:0x8000,header,instrumentOffset:0x200,instrumentSegment:0x8000,instrument:patch,sequenceOffset:1,sequenceSegment:0x9000,sequence:Uint8Array.of(0,0xdc,0,1,0xd9)}];
 const result=stepOriginalMt32Effects({physicsEngine,timers,voices,lastNotes:new Uint8Array(24),driver:new Uint8Array(1750)},resources);
 assert.equal(result.writes.some(([port,value])=>port===0x330&&value===0xf0),physicsEngine==='ms-1991');assert.equal(result.physicsEngine,physicsEngine);
 assert.equal(timers[16][0x47],0,'Source timers remain unchanged');
 const car=new Uint8Array(76),cv=new DataView(car.buffer);car[0]=1;cv.setUint16(0x24,0x200,true);cv.setUint16(0x26,0x8000,true);patch[14]=1;
 for(const voice of voices)voice[0]=255;timers[0][0x16]=15;
 const engine=startOriginalMt32Engine({physicsEngine,car,timers,voices,lastNotes:new Uint8Array(24),command:new Uint8Array(10),driver:new Uint8Array(1750)},patch);
 assert.equal(engine.writes.some(([port,value])=>port===0x330&&value===0xf0),physicsEngine==='ms-1991');assert.equal(engine.physicsEngine,physicsEngine);assert.equal(car[1],0);
}
console.log('MT15 effect instrument forwards explicit generation, retains identity and legacy/default behavior');
