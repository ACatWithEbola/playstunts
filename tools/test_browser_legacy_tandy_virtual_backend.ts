import assert from 'node:assert/strict';
import {createBrowserLegacyTandyVirtualBackend} from '../lib/game/browser-legacy-tandy-virtual-backend.ts';
import {audioTimerSampleOffsets} from '../lib/game/audio-sample-clock.ts';
import {createOriginalTandyToneStream} from '../lib/game/tandy-tone-audio.ts';
for(const rate of [44100,48000]){
 function fixture(){
  let ticks=0;const memory=new Uint8Array(0x100000);
  const backend=createBrowserLegacyTandyVirtualBackend(rate);
  backend.attach(()=>memory,function*(){ticks++;yield {writes:[[0xc0,0x90],[0xc0,0x80|(ticks&7)],[0xc0,16]],sampleStarts:[],bios:[]};return {writes:[],bios:[]};});
  backend.write([[0x43,0xb6]]);return {backend,count:()=>ticks};
 }
 const whole=fixture(),split=fixture(),frames=20000;
 const pcm=whole.backend.render(frames),parts=[1,511,4096,15392];
 let legacyTicks=0;
 const old=createOriginalTandyToneStream({tick(){legacyTicks++;return {writes:[[0xc0,0x90],[0xc0,0x80|(legacyTicks&7)],[0xc0,16]],bios:[]};}},[],rate,{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1});
 const originalPcm=old.render(frames);let error=0;for(let i=0;i<frames;i++)error=Math.max(error,Math.abs(originalPcm[i]-pcm[i]));
 assert.equal(error,0,'Tone-only frequency-change fixture preserves pre-existing PCM exactly');
 assert.equal(legacyTicks,whole.count());console.log(`${rate}: pre-existing tone path comparison max PCM difference ${error}`);
 assert.equal(parts.reduce((a,b)=>a+b),frames);
 assert.deepEqual([...pcm],parts.flatMap(count=>[...split.backend.render(count)]));
 assert.equal(whole.count(),audioTimerSampleOffsets(0,frames,rate).offsets.length);assert.equal(whole.count(),split.count());
 assert.ok(pcm.every(Number.isFinite));assert.ok(pcm.some(value=>value!==0));
 const count=whole.count();assert.throws(()=>whole.backend.render(-1),/Invalid/);assert.equal(whole.count(),count);
 whole.backend.write([[0x61,3]]);assert.equal(whole.backend.port61,3);
 whole.backend.close();split.backend.close();assert.throws(()=>whole.backend.render(1),/unavailable/);
 // Long active transfer must reject reattachment before destroying old owner.
 const memory=new Uint8Array(0x100000),busy=createBrowserLegacyTandyVirtualBackend(rate);let calls=0;
 busy.attach(()=>memory,function*(){calls++;yield {writes:[],sampleStarts:[],bios:[{ax:0x8307,es:0,bx:0,cx:65535,dx:4095}]};return {writes:[],bios:[]};});
 busy.render(600);assert.equal(calls,1);assert.equal(busy.status().carry,true);
 assert.throws(()=>busy.attach(()=>memory,function*(){return {writes:[],bios:[]};}),/idle owner/);assert.equal(busy.status().carry,true);busy.close();
 // Program errors poison/close the backend, preventing another game dispatch.
 const faulty=createBrowserLegacyTandyVirtualBackend(rate);let failures=0;
 faulty.attach(()=>memory,function*(){failures++;throw Error('Injected browser legacy program fault');return {writes:[],bios:[]};});
 assert.throws(()=>faulty.render(600),/Injected browser legacy program fault/);assert.equal(failures,1);assert.throws(()=>faulty.render(600),/unavailable/);assert.equal(failures,1);faulty.close();
}
console.log('Browser legacy virtual backend shares one exact PIT timer across splits, keeps active owner on rejected attachment and closes dispatch on program fault; AudioContext surfaces not exercised');
for(const rate of [44100,48000]){
 const memory=new Uint8Array(0x100000),driver=memory.subarray(0x39e10,0x39e10+2993),view=new DataView(driver.buffer,driver.byteOffset,driver.byteLength);
 driver[0x504]=1;driver[0x505]=0;driver[0x50e]=7;
 for(const [offset,value] of [[0x506,0],[0x508,0],[0x50a,4000],[0x50c,123]])view.setUint16(offset,value,true);
 let calls=0;const backend=createBrowserLegacyTandyVirtualBackend(rate);
 backend.attach(()=>memory,function*(){calls++;yield {writes:[],sampleStarts:[],bios:[{ax:0x8307,es:0,bx:0,cx:4000,dx:123}]};return {writes:[],bios:[]};});
 backend.render(600);assert.equal(backend.status().carry,true);const before=calls;
 let waits=0;assert.equal(await backend.stopForResourceRelease(async()=>{assert.ok(++waits<30);backend.render(512);}),true);
 assert.equal(driver[0x504],0);assert.equal(backend.status().carry,false);assert.equal(calls,before);assert.ok(waits>0);
 backend.render(600);assert.ok(calls>before,'Cancelled replay load can resume attached race after successful drain');
 // New sample started by the resumed race must drain before replacement again.
 assert.equal(await backend.stopForResourceRelease(async()=>{backend.render(512);}),true);
 backend.attach(()=>memory,function*(){return {writes:[],bios:[]};});backend.render(600);
 const aborted=new AbortController();aborted.abort();assert.equal(await backend.stopForResourceRelease(async()=>{throw Error('Unexpected wait');},aborted.signal),false);backend.close();
}
console.log('Resource stop clears original repeat flag, drains active bytes without another game dispatch and permits idle reattachment; pre-aborted stop does not wait');
for(const action of ['abort','close'] as const){
 const memory=new Uint8Array(0x100000),backend=createBrowserLegacyTandyVirtualBackend(48000),controller=new AbortController();
 backend.attach(()=>memory,function*(){yield {writes:[],sampleStarts:[],bios:[{ax:0x8307,es:0,bx:0,cx:4000,dx:123}]};return {writes:[],bios:[]};});backend.render(600);
 let rejectWait:(error:Error)=>void=()=>{};
 const waiting=new Promise<void>((_resolve,reject)=>{rejectWait=reject;});
 const stopped=backend.stopForResourceRelease(()=>waiting,controller.signal);
 await Promise.resolve();if(action==='abort')controller.abort();else backend.close();
 assert.equal(await stopped,false,'Cancellation settles despite unresolved frame wait');
 rejectWait(Error('Late frame failure'));await Promise.resolve();backend.close();
}
console.log('Resource drain cancellation/closure settles with unresolved frame wait; late owner rejection handled without resumed playback');
