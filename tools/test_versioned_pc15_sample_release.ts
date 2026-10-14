import assert from 'node:assert/strict';
import {stepOriginalPcSpeakerVoiceTimer} from '../lib/game/pc-speaker-voice-timer.ts';
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const driver=new Uint8Array(0x2e9),shift=physicsEngine==='ms-1991'?10:0,v=new DataView(driver.buffer);
 driver[0x1a8]=255;driver[0x2dd+shift]=0xa5;
 v.setUint16(0x2d3+shift,0x1234,true);v.setUint16(0x2d5+shift,0x5678,true);
 const voices=Array.from({length:physicsEngine==='ms-1991'?7:5},()=>new Uint8Array(46)),timers=Array.from({length:24},()=>new Uint8Array(72));
 const record=voices[0],r=new DataView(record.buffer);record[0]=16;record[1]=1;record[22]=4;r.setUint16(20,1,true);r.setUint16(42,0x801e+16*72,true);timers[16][0x15]=1;
 const instrument=new Uint8Array(100);new DataView(instrument.buffer).setUint16(38,1,true);
 const before=driver.slice();const next=stepOriginalPcSpeakerVoiceTimer({physicsEngine,driver,voices,timers,lastNotes:new Uint8Array(24)},()=>instrument,0);
 assert.equal(next.voices[0][1],0);assert.equal(next.timers[16][0x15],0);assert.equal(next.driver[0x1a8],0);
 assert.deepEqual(next.restoreVector,{offset:0x1234,segment:0x5678});assert.ok(next.writes.some(([port,value])=>port===0x21&&value===0xa5));
 assert.deepEqual(driver,before);
}
console.log('Sample voice release restores versioned timer/vector, retires owner and preserves source state');
