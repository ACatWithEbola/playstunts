import assert from 'node:assert/strict';
import {startOriginalPcSpeakerNote} from '../lib/game/pc-speaker-note-start.ts';
import {pcSpeakerChannelMasks} from '../lib/game/pc-speaker-control.ts';
import {startOriginalPcSpeakerSampleNote,type OriginalPcSpeakerSampleResult} from '../lib/game/pc-speaker-sample.ts';
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const driver=new Uint8Array(0x2e9),shift=physicsEngine==='ms-1991'?10:0;
 new DataView(driver.buffer).setUint16(0x2d7+shift,65535,true);
 new DataView(driver.buffer).setUint16(0x12f+60*2,8000,true);
 const voices=pcSpeakerChannelMasks(physicsEngine).map(()=>{const b=new Uint8Array(46);b[0]=255;return b;});
 const timers=Array.from({length:24},(_,i)=>{const b=new Uint8Array(72);b[0x16]=15;b[0x23]=i;return b;});
 const instrument=new Uint8Array(100);new DataView(instrument.buffer).setUint16(12,1,true);
 const command=new Uint8Array(10);command[4]=60;new DataView(command.buffer).setUint32(6,100,true);
 const input={alternate:false,channelMasks:pcSpeakerChannelMasks(physicsEngine),owner:16,instrument,instrumentPointer:{offset:0x100,segment:0x9000},timers,voices,lastNotes:new Uint8Array(24),command};
 const options={driverSegment:0x8000,port61:0,interruptMask:0xa5,irqVector:{offset:0x1234,segment:0x5678},sample:{offset:0x100,segment:0x9000,length:128}};
 const originalDriver=driver.slice();
 const outputs:OriginalPcSpeakerSampleResult[]=[];let resolved=0;
 const result=startOriginalPcSpeakerNote(input,driver,{physicsEngine,resolve(bytes){assert.deepEqual(bytes,instrument);resolved++;return options;},emit(output){outputs.push(output);}});
 assert.equal(result.voice,0);assert.equal(resolved,1);assert.equal(outputs.length,1);
 const expected=driver.slice(),record=result.voices[0].slice();const oracle=startOriginalPcSpeakerSampleNote(expected,record,60,options,physicsEngine);
 assert.deepEqual(result.driver,expected);assert.deepEqual(outputs[0],oracle);assert.deepEqual(result.voices[0],record);
 assert.deepEqual(driver,originalDriver,'Input driver stays unchanged');
 assert.throws(()=>startOriginalPcSpeakerNote(input,driver),/sample startup/,'Missing host must reject, not silently drop sample');
}
console.log('Sample slot note adapter emits exact versioned startup requests; explicit host required and source state unchanged');
