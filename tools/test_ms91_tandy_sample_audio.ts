import assert from 'node:assert/strict';
import {createMs91TandySampleAudio} from '../lib/game/ms91-tandy-sample-audio.ts';
function run(blocks:number[],differential:boolean){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),base=0x20000,header=0x30100;
 v.setUint16(base+0x58c,0x2e9c,true);v.setUint16(0x20,0x1234,true);v.setUint16(0x22,0x5678,true);
 memory[header+4]=differential?6:0;v.setUint16(header+8,6,true);memory.set([128,0x37,0x86,0xd9,0x2c,128],header+0x32);
 let elapsed=0;const writes:number[][]=[];
 const audio=createMs91TandySampleAudio(()=>memory,0x2000,{sampleRate:48000,picMask:0x80,interruptsEnabled:()=>true,
  initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,
  write:(port,value,offset)=>writes.push([port,value,elapsed+offset]),gameInterrupt(){}});
 audio.start({channel:0,offset:0x100,segment:0x3000,frequency:8000,repeats:1});
 const pcm=new Float32Array(blocks.reduce((a,b)=>a+b,0));
 for(const frames of blocks){pcm.set(audio.render(frames),elapsed);elapsed+=frames;}
 assert.ok(pcm.every(Number.isFinite));assert.ok(pcm.some(value=>value!==0));assert.equal(audio.status(0),1);
 assert.ok(pcm.slice(100).every(value=>value===0),'Stopped direct mode produces no direct sample contribution');
 audio.close();assert.throws(()=>audio.render(1),/unavailable/);
 return {pcm,writes,driver:memory.slice(base,base+3241)};
}
for(const differential of [false,true])assert.deepEqual(run([4800],differential),run([1,17,100,333,4349],differential));
const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),base=0x20000,header=0x30100;
v.setUint16(base+0x58c,0x2e9c,true);v.setUint16(header+8,200,true);memory.fill(192,header+0x32,header+0x32+200);
const audio=createMs91TandySampleAudio(()=>memory,0x2000,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,
 initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,write(){},gameInterrupt(){}});
audio.start({channel:0,offset:0x100,segment:0x3000,frequency:8000,repeats:1});
assert.ok(audio.render(8).some(value=>value===0.5));
const cursor=v.getUint16(base+0x57e,true);audio.writeDac(0xc7,0);assert.equal(v.getUint16(base+0x57e,true),cursor,'Volume write does not restart transfer');
assert.ok(audio.render(8).every(value=>value===0));audio.writeDac(0xc7,0xe0);
assert.ok(audio.render(8).every(value=>value===0.5));assert.equal(audio.status(0),0);
assert.equal(audio.requestStop(),false);assert.ok(audio.render(512).slice(10).every(value=>value===0));assert.equal(audio.status(0),1);
audio.close();assert.throws(()=>audio.writeDac(0xc7,0),/unavailable/);
console.log('Modern raw/differential sample IRQs render finite nonzero direct-DAC PCM with exact split-block output, stop routing and unchanged driver trace; explicit virtual CPU/mapping, not analog or browser listening proof');
function startFromGameIrq(blocks:number[],differential:boolean){
 const bytes=new Uint8Array(0x100000),view=new DataView(bytes.buffer),base=0x20000,header=0x30100;
 view.setUint16(base+0x58c,0x2e9c,true);view.setUint16(0x20,0x1234,true);view.setUint16(0x22,0x5678,true);
 bytes[header+4]=differential?6:0;view.setUint16(header+8,6,true);bytes.set([128,0x37,0x86,0xd9,0x2c,128],header+0x32);
 let elapsed=0,started=false,startFrame=-1;const writes:number[][]=[],irqs:number[]=[];
 const request={channel:0,offset:0x100,segment:0x3000,frequency:8000,repeats:1};
 const stream=createMs91TandySampleAudio(()=>bytes,0x2000,{sampleRate:48000,picMask:0x80,interruptsEnabled:()=>true,
  initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,
  write:(port,value,offset)=>writes.push([port,value,elapsed+offset]),gameInterrupt(offset){
   irqs.push(elapsed+offset);if(!started){
    const before=bytes.slice();assert.throws(()=>stream.startAt(request,offset+0.5),/position/);assert.deepEqual(bytes,before);
    assert.equal(stream.startAt(request,offset),true);started=true;startFrame=elapsed+offset;
   }
  }});
 assert.throws(()=>stream.startAt(request,0),/position/);
 const pcm=new Float32Array(blocks.reduce((sum,n)=>sum+n,0));
 for(const frames of blocks){pcm.set(stream.render(frames),elapsed);elapsed+=frames;}
 assert.ok(startFrame>0);assert.ok(pcm.slice(0,startFrame).every(value=>value===0));
 assert.ok(pcm.slice(startFrame).some(value=>value!==0));assert.equal(stream.status(0),1);
 assert.ok(writes.every((entry,index)=>index===0||entry[2]>=writes[index-1][2]));
 stream.close();return {pcm,writes,irqs,startFrame,bytes};
}
for(const differential of [false,true])assert.deepEqual(startFromGameIrq([5120],differential),startFromGameIrq([1,17,100,333,4669],differential));
console.log('Chained game IRQ starts retain their exact delivery position and PIT phase across raw/differential split buffers; invalid positions leave driver memory unchanged');
for(const caught of [true,false]){
 const bytes=new Uint8Array(0x100000);new DataView(bytes.buffer).setUint16(0x2058c,0x2e9c,true);
 let callbacks=0;
 const stream=createMs91TandySampleAudio(()=>bytes,0x2000,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,
  initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,write(){},gameInterrupt(){
   callbacks++;const before=bytes.slice();
   if(caught){assert.throws(()=>stream.render(0),/already active/);assert.deepEqual(bytes,before);}
   else stream.render(0);
  }});
 if(caught){assert.ok(stream.render(512).every(Number.isFinite));assert.ok(stream.render(512).every(Number.isFinite));assert.ok(callbacks>1);}
 else{assert.throws(()=>stream.render(512),/already active/);assert.throws(()=>stream.render(1),/unavailable/);}
 stream.close();
}
console.log('Nested sample rendering rejects before buffer or memory mutation; caught errors retain outer rendering, unhandled callback failure disables reuse');
for(const closeAt of ['game','after','decode','write'] as const){
 const bytes=new Uint8Array(0x100000),view=new DataView(bytes.buffer);view.setUint16(0x2058c,0x2e9c,true);
 view.setUint16(0x30108,200,true);bytes.fill(192,0x30132,0x30132+200);
 let active=false,game=0,after=0,writes=0;
 const stream=createMs91TandySampleAudio(()=>bytes,0x2000,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,
  initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},
  decodeByte(value){if(active&&closeAt==='decode')stream.close();return (value-128)/128;},
  write(){writes++;if(active&&closeAt==='write')stream.close();},
  gameInterrupt(){game++;if(closeAt==='game')stream.close();},afterInterrupt(){after++;if(closeAt==='after')stream.close();}});
 if(closeAt==='decode'||closeAt==='write')stream.start({channel:0,offset:0x100,segment:0x3000,frequency:8000,repeats:1});
 active=true;assert.throws(()=>stream.render(2048),/unavailable/);
 if(closeAt==='game'){assert.equal(game,1);assert.equal(after,0);}
 if(closeAt==='after')assert.equal(after,1);
 const memoryAfter=bytes.slice(),counts=[game,after,writes];assert.throws(()=>stream.render(1),/unavailable/);
 assert.deepEqual(bytes,memoryAfter);assert.deepEqual([game,after,writes],counts);stream.close();
}
console.log('Closing modern sample audio from game/after/write/decode callbacks prevents later callbacks and PCM delivery');
