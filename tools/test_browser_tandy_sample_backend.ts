import assert from 'node:assert/strict';
import {createBrowserTandyRaceAudio} from '../lib/game/browser-tandy-race-audio.ts';
import {createMs91TandySampleAudio} from '../lib/game/ms91-tandy-sample-audio.ts';
import {createLegacyTandySampleAudio} from '../lib/game/legacy-tandy-sample-audio.ts';
import {createMs91TandyRaceBinding} from '../lib/game/ms91-tandy-race-binding.ts';
import {createLegacyTandyMixedAudio} from '../lib/game/legacy-tandy-mixed-audio.ts';
import {createLegacyTandyRaceBinding} from '../lib/game/legacy-tandy-race-binding.ts';
function backend(modern:boolean|'mixed-raw'|'mixed-differential'|'legacy-mixed'|'legacy-binding'|'legacy-delayed-binding'){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer);
 if(modern==='legacy-binding'||modern==='legacy-delayed-binding'){
  memory.set([128,55,134,217,44,128],0x30000);
  const deferred=modern==='legacy-delayed-binding';
  const binding=createLegacyTandyRaceBinding(address=>memory[address],{deferCompletionInterrupts:deferred,sampleRate:48000,initialByte:128,initialVolume:0,decodeByte:value=>(value-128)/128,sampleGain:.5,
   tone:{variant:'pssj3',clockHz:3579545,psgGain:.5,speakerGain:1},completion(ax,frame,bus){if(deferred){assert.equal(ax,0x91fb);assert.equal(frame,700);bus.write([[0xc0,0x9f]]);}},nestedInterrupt(){},
   program:function*(){yield {writes:[],bios:[{ax:0x8307,es:0x3000,bx:0,cx:6,dx:123}],sampleStarts:[]};return {writes:[],bios:[]};},
   bios(request,_frame,bus){assert.equal(bus.play(request).carry,false);return false;},
  });
  binding.scheduleGameInterrupt(0);for(let byte=0;byte<6;byte++)binding.scheduleDma((byte+1)*6);binding.scheduleBiosReturn(40);
  if(deferred)binding.scheduleCompletionInterrupt(700);
  return binding;
 }
 if(modern==='legacy-mixed'){
  memory.set([128,55,134,217,44,128],0x30000);
  const mixed=createLegacyTandyMixedAudio(address=>memory[address],{sampleRate:48000,initialByte:128,initialVolume:0,decodeByte:value=>(value-128)/128,sampleGain:.5,
   tone:{variant:'pssj3',clockHz:3579545,psgGain:.5,speakerGain:1},completion(){},gameInterrupt(_frame,bus){bus.write([[0xc0,0x92]]);}});
  mixed.scheduleBios(0,{ax:0x8307,es:0x3000,bx:0,cx:6,dx:123});for(let byte=0;byte<6;byte++)mixed.scheduleDma((byte+1)*6);mixed.scheduleGameInterrupt(480);
  return mixed;
 }
 if(typeof modern==='string'){
  const header=0x30100;v.setUint16(0x20000+0x58c,0x2e9c,true);
  v.setUint16(0x20,0x1234,true);v.setUint16(0x22,0x5678,true);
  memory[header+4]=modern==='mixed-differential'?6:0;
  v.setUint16(header+8,6,true);memory.set([128,55,134,217,44,128],header+50);
  let started=false;
  const audio=createMs91TandyRaceBinding(0x2000,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,
   initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,
   tone:{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1},sampleGain:0.5,
   busWrite(){}});
  audio.attach(()=>memory,()=>{if(!started){audio.sampleStarts([{channel:0,offset:0x100,segment:0x3000,frequency:8000,repeats:1}],memory);started=true;}return [[0xc7,0xe0]];});
  return audio;
 }
 if(modern){
  const header=0x30100;v.setUint16(0x20000+0x58c,0x2e9c,true);v.setUint16(header+8,6,true);memory.set([128,55,134,217,44,128],header+50);
  const audio=createMs91TandySampleAudio(()=>memory,0x2000,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,
   initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,write(){},gameInterrupt(){}});
  audio.start({channel:0,offset:0x100,segment:0x3000,frequency:8000,repeats:1});
  return {sampleRate:48000,port61:0,render:audio.render,write(writes:number[][]){for(const [port,value] of writes)audio.writeDac(port,value);},close:audio.close};
 }
 memory.set([128,55,134,217,44,128],0x30000);
 const audio=createLegacyTandySampleAudio(address=>memory[address],{initialByte:128,initialVolume:7,decodeByte:value=>(value-128)/128,completion(){}});
 audio.play({ax:0x8307,es:0x3000,bx:0,cx:6,dx:123});for(let byte=0;byte<6;byte++)audio.dmaEdge((byte+1)*6);
 return {sampleRate:48000,port61:0,render:audio.render,write(writes:number[][]){for(const [port,value] of writes)audio.write(port,value);},close:audio.close};
}
for(const modern of [false,true,'mixed-raw','mixed-differential','legacy-mixed','legacy-binding','legacy-delayed-binding'] as const){
 const actual=backend(modern),expected=backend(modern),buffers:Float32Array[]=[],sources:any[]=[];
 let disconnected=0;
 const context={sampleRate:48000,currentTime:0,state:'running',destination:{},
  createGain:()=>({gain:{value:0},connect(){},disconnect(){disconnected++;}}),
  createBuffer:()=>({copyToChannel(samples:Float32Array){buffers.push(samples.slice());}}),
  createBufferSource(){const source={buffer:null as unknown,onended:null as unknown,stopped:0,disconnected:0,connect(){},start(){},stop(){this.stopped++;},disconnect(){this.disconnected++;}};sources.push(source);return source;}};
 const initialWrites=typeof modern==='string'?[[0xc0,0x85],[0xc1,0x10],[0xc0,0x90]]:[];
 expected.write(initialWrites);
 const browser=createBrowserTandyRaceAudio(context as unknown as AudioContext,initialWrites,()=>{assert.fail('Sample backend owns dispatch');return [];},actual);
 try{
  browser.pump();assert.ok(buffers.some(buffer=>buffer.some(value=>value!==0)));
  for(const buffer of buffers)assert.deepEqual(buffer,expected.render(buffer.length),'Browser-delivered sample PCM matches selected renderer');
  browser.suspend();assert.ok(sources.every(source=>source.stopped===1&&source.disconnected===1&&source.buffer===null));
  const pausedBuffers=buffers.length;context.currentTime=10;browser.pump();assert.equal(buffers.length,pausedBuffers,'Suspended queue must not advance backend');
  browser.resume();browser.pump();assert.ok(buffers.length>pausedBuffers);
  for(const buffer of buffers.slice(pausedBuffers))assert.deepEqual(buffer,expected.render(buffer.length),'Resume retains backend timing without processing elapsed wall time');
  browser.close();assert.equal(disconnected,1);assert.ok(sources.every(source=>source.stopped===1&&source.disconnected===1&&source.buffer===null));
  const before=buffers.length;browser.pump();assert.equal(buffers.length,before);
 }finally{browser.close();actual.close();expected.close();}
}
console.log('Legacy/modern samples and mixed legacy/raw/differential audio pass exact PCM through browser adapter, pause/resume and queued-source disposal; fake Web Audio/explicit owner timing, not production game wiring or physical listening');
