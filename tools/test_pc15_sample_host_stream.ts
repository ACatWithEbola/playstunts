import assert from 'node:assert/strict';
import {createAllocatedPc15SampleHost} from '../lib/game/allocated-pc15-sample-host.ts';
import {createPc15InterruptAudioStream} from '../lib/game/pc15-interrupt-audio-stream.ts';
import {startOriginalPcSpeakerSampleNote} from '../lib/game/pc-speaker-sample.ts';
import {ORIGINAL_PIT_DIVISOR} from '../lib/game/timer-interrupt.ts';
for(const engine of ['ms-1990','ms-1991'] as const){
 const memory=new Uint8Array(0x100000),d=0x60000,driverSegment=0x8000,base=driverSegment*16,shift=engine==='ms-1991'?10:0,v=new DataView(memory.buffer);
 memory[d+0x9fe4]=engine==='ms-1991'?7:5;
 v.setUint16(0x20,0x1234,true);v.setUint16(0x22,0x5678,true);
 v.setUint16(base+0x2d7+shift,ORIGINAL_PIT_DIVISOR,true);v.setUint16(base+0x12f+30*2,8000,true);
 const instrument=new Uint8Array(100),iv=new DataView(instrument.buffer);iv.setUint16(6,0x100,true);iv.setUint16(8,0x9000,true);v.setUint16(0x90108,128,true);
 for(let i=0;i<128;i++)memory[0x90132+i]=i*2;
 let ordinaryTicks=0;
 const host=createAllocatedPc15SampleHost(()=>memory,d,driverSegment,{port61:()=>0,interruptMask:()=>0xa5},vector=>{assert.deepEqual(vector,{offset:0x1234,segment:0x5678});ordinaryTicks++;return [];});
 const driver=memory.slice(base,base+0x2e9),voice=new Uint8Array(46);
 host.noteHost.emit(startOriginalPcSpeakerSampleNote(driver,voice,30,host.noteHost.resolve(instrument),engine));memory.set(driver,base);
 const stream=createPc15InterruptAudioStream(host,host.takeWrites(),44100);
 assert.equal(stream.divisor,70);const pcm=stream.render(44100);
 assert.ok(pcm.some(n=>n!==0));assert.equal(memory[base+0x1a8],0);
 assert.equal(stream.divisor,ORIGINAL_PIT_DIVISOR);assert.deepEqual([v.getUint16(0x20,true),v.getUint16(0x22,true)],[0x1234,0x5678]);assert.ok(ordinaryTicks>90);
}
console.log('Both PC15 generations play isolated sample pulses, end, restore vector/timer and resume ordinary callbacks without hardware audio');
