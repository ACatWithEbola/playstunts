import assert from 'node:assert/strict';
import {stepOriginalPcSpeakerEffects} from '../lib/game/pc-speaker-effect-runtime.ts';
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const driver=new Uint8Array(0x2e9),shift=physicsEngine==='ms-1991'?10:0;
 driver[0x1a8]=255;driver[0x2dd+shift]=0xa5;
 driver[0x2d7+shift]=0x12;driver[0x2d8+shift]=0x34;
 const v=new DataView(driver.buffer);v.setUint16(0x2d3+shift,0x1234,true);v.setUint16(0x2d5+shift,0x5678,true);
 const timers=Array.from({length:24},()=>new Uint8Array(72)),voices=Array.from({length:physicsEngine==='ms-1991'?7:5},()=>{const b=new Uint8Array(46);b[0]=255;return b;});
 voices[0][0]=16; // Sample owner remains allocated but inactive when sequence ends.
 const t=new DataView(timers[16].buffer);t.setUint16(0,1,true);t.setUint16(2,0x9000,true);
 const result=stepOriginalPcSpeakerEffects({physicsEngine,driver,timers,voices,lastNotes:new Uint8Array(24)},[{headerOffset:0,headerSegment:0,header:new Uint8Array(),instrumentOffset:0,instrumentSegment:0,instrument:new Uint8Array(),sequenceOffset:1,sequenceSegment:0x9000,sequence:Uint8Array.of(0,0xd9)}],0);
 assert.ok(result.writes.some(([port,value])=>port===0x21&&value===0xa5));
 assert.deepEqual(result.writes.filter(([port])=>port===0x40),[[0x40,0x12],[0x40,0x34]]);
 assert.equal(new DataView(result.driver.buffer).getUint32(0x2d3+shift,true),0);
 assert.equal(result.voices[0][0],255);assert.equal(result.driver[0x1a8],0);
 assert.equal(result.physicsEngine,physicsEngine);
}
console.log('Effect sequence end restores the selected PC15 sample timer layout in both generations');
