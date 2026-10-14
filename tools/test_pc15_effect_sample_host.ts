import assert from 'node:assert/strict';
import {createAllocatedPc15SampleHost} from '../lib/game/allocated-pc15-sample-host.ts';
import {stepOriginalPcSpeakerEffects} from '../lib/game/pc-speaker-effect-runtime.ts';
import {createPc15InterruptAudioStream} from '../lib/game/pc15-interrupt-audio-stream.ts';
import {ORIGINAL_PIT_DIVISOR} from '../lib/game/timer-interrupt.ts';
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const memory=new Uint8Array(0x100000),d=0x60000,driverSegment=0x8000,base=driverSegment*16,modern=physicsEngine==='ms-1991',view=new DataView(memory.buffer);
 memory[d+0x9fe4]=modern?7:5;view.setUint16(0x20,0x1234,true);view.setUint16(0x22,0x5678,true);
 view.setUint16(base+0x2d7+(modern?10:0),ORIGINAL_PIT_DIVISOR,true);view.setUint16(base+0x12f+30*2,8000,true);
 const instrument=new Uint8Array(100),iv=new DataView(instrument.buffer);iv.setUint16(6,0x100,true);iv.setUint16(8,0x9000,true);iv.setUint16(12,1,true);iv.setUint16(30,100,true);iv.setUint16(32,100,true);iv.setUint16(36,100,true);
 view.setUint16(0x90108,128,true);for(let i=0;i<128;i++)memory[0x90132+i]=i*2;
 const timers=Array.from({length:24},(_,owner)=>{const t=new Uint8Array(72);t[0x23]=owner;t[0x16]=15;return t;}),voices=Array.from({length:modern?7:5},()=>{const v=new Uint8Array(46);v[0]=255;return v;});
 const t=new DataView(timers[16].buffer);t.setUint16(0,1,true);t.setUint16(2,0xa000,true);t.setUint16(0x1e,0x100,true);t.setUint16(0x20,0x9000,true);
 const host=createAllocatedPc15SampleHost(()=>memory,d,driverSegment,{port61:()=>0,interruptMask:()=>0xa5},()=>[]);
 const result=stepOriginalPcSpeakerEffects({physicsEngine,timers,voices,lastNotes:new Uint8Array(24),driver:memory.slice(base,base+(modern?0x2e9:0x2df))},[{headerOffset:0,headerSegment:0,header:new Uint8Array(),instrumentOffset:0x100,instrumentSegment:0x9000,instrument,sequenceOffset:1,sequenceSegment:0xa000,sequence:Uint8Array.of(0,30,100,1,0xd9)}],0,undefined,host.noteHost);
 memory.set(result.driver,base);assert.equal(result.voices[0][0],16);assert.equal(result.driver[0x1a8],255);
 assert.deepEqual(host.takeWrites(),[],'Sequencer returns all writes in call-site order, no duplicate host queue');
 const stream=createPc15InterruptAudioStream(host,result.writes,44100);
 stream.render(44100);assert.equal(memory[base+0x1a8],0);assert.equal(stream.divisor,ORIGINAL_PIT_DIVISOR);
 assert.deepEqual([view.getUint16(0x20,true),view.getUint16(0x22,true)],[0x1234,0x5678]);
}
console.log('Both-generation effect sequence allocates sample slot, plays via virtual IRQ stream and restores original timer/vector');
