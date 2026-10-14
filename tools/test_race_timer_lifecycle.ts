import assert from 'node:assert/strict';
import {waitOriginalGameTicks,removeNativeRaceFrameTimer} from '../lib/game/remove-race-frame-timer.ts';
import {addOriginalTimerCallback} from '../lib/game/add-timer-callback.ts';
for(const [start,ticks] of [[100,10],[0,0],[0xfffffffe,10],[0x7fffffff,2],[0xfffffff0,15]]){
 let clock=start,reads=0;
 await waitOriginalGameTicks(async()=>{reads++;return clock++>>>0;},ticks);
 const target=(start+ticks)>>>0;
 assert.equal(reads,target<=((start+1)>>>0)?2:ticks+1);
}
for(const cadence of [10,20]){
 const memory=new Uint8Array(65536),v=new DataView(memory.buffer);
 addOriginalTimerCallback(memory,0,11,22);addOriginalTimerCallback(memory,0,0x9b8,0x1396);addOriginalTimerCallback(memory,0,33,44);
 let clock=100,reads=0;
 await removeNativeRaceFrameTimer({memory:()=>memory,async gameCounter(){assert.equal(v.getUint16(0x4098,true),0x1396,'Callback must remain registered throughout the ten undivided ticks');reads++;return clock++;}},0);
 assert.equal(reads,11,'Removal delay must not depend on simulation cadence '+cadence);
 assert.equal(v.getUint16(0x4092,true),11);assert.equal(v.getUint16(0x4094,true),22);
 assert.equal(v.getUint16(0x4096,true),33);assert.equal(v.getUint16(0x4098,true),44);
 assert.equal(v.getUint32(0x409a,true),0);
}
console.log(JSON.stringify({unsignedWaitCases:5,removalCadences:2,callbackPreservationAndOrder:true,pass:true}));
