import assert from 'node:assert/strict';
import {createLegacyTandyFineRaceBinding,type LegacyTandyFineBus} from '../lib/game/legacy-tandy-fine-race-binding.ts';
import {createOriginalTandyToneAudio} from '../lib/game/tandy-tone-audio.ts';
function fixture(fault=false){
 let calls=0,released=false,retained:LegacyTandyFineBus|undefined;const reads:number[]=[],toneWrites:number[][]=[];
 const tone=createOriginalTandyToneAudio(48000,{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1});
 const binding=createLegacyTandyFineRaceBinding(address=>{reads.push(address);if(fault)throw Error('Fine DMA fault');return address?255:128;},{sampleRate:48000,clockHz:3579545,divisor:1,volume:0,initialByte:128,decodeByte:b=>(b-128)/128,sampleGain:1,grant:()=>true,
  bios(request,_tick,bus){retained=bus;assert.equal(bus.play(request).carry,false);return ++calls!==1;},completion(){},toneWrites(writes){assert.ok(writes.every(([port])=>port!==0xc6&&port!==0xc7));for(const [port,value] of writes){toneWrites.push([port,value]);tone.write(port,value);}}});
 function* program(){try{yield {writes:[[0xc6,123],[0xc7,0]],sampleStarts:[],bios:[{ax:0x8300,es:0,bx:0,cx:1,dx:1}]};yield {writes:[[0xc0,0x9f]],sampleStarts:[],bios:[{ax:0x8307,es:0,bx:1,cx:2,dx:123}]};return {writes:[],bios:[]};}finally{released=true;}}
 binding.start(program());assert.equal(binding.waitingForBiosReturn,true);
 return {binding,reads,toneWrites,released:()=>released,bus:()=>retained!};
}
const whole=fixture(),split=fixture();
assert.throws(()=>whole.bus().status(),/no owning callback/);assert.throws(()=>whole.bus().advance(1),/no owning callback/);
for(const item of [whole,split]){item.binding.advance(1);assert.equal(item.binding.serviceInterrupt(false),false);item.binding.serviceInterrupt(true);item.binding.biosReturned();assert.equal(item.binding.waiting,false);assert.equal(item.released(),true);}
whole.binding.advance(1000);for(const count of [1,99,900])split.binding.advance(count);
assert.deepEqual([...whole.binding.render(10)],[...split.binding.render(1),...split.binding.render(9)]);assert.deepEqual(whole.binding.snapshot(),split.binding.snapshot());assert.deepEqual(whole.reads,[0,1,2]);
for(const item of [whole,split]){item.binding.close();assert.throws(()=>item.bus().play({ax:0x8307,es:0,bx:0,cx:1,dx:1}),/unavailable/);}
const cancel=fixture();cancel.binding.close();assert.equal(cancel.released(),true);assert.equal(cancel.binding.waiting,false);assert.deepEqual(cancel.reads,[]);
const error=fixture(true);assert.throws(()=>error.binding.advance(1),/Fine DMA fault/);assert.equal(error.released(),true);assert.equal(error.binding.waiting,false);assert.throws(()=>error.binding.render(1),/unavailable/);assert.deepEqual(error.reads,[0]);
const invalid=fixture();assert.throws(()=>invalid.binding.write([[0xc0,0x90],[0xc7,999]]),/Invalid/);assert.deepEqual(invalid.toneWrites,[]);assert.equal(invalid.released(),true);assert.deepEqual(invalid.reads,[]);
console.log('Unified fine race binding preserves split PCM/device state, separates BIOS return, closes CPU/device/projection together and revokes retained bus on cancellation/fault; BIOS policy supplied');

// Observed SL/2/8086 reference: mutedCX1,DX1 completes inside AH83, not
// after return. One chip here establishes ordering only, not measured latency.
for(const sampleRate of [44100,48000]){
 const events:string[]=[],reads:number[]=[];let complete=0,released=false;
 const binding=createLegacyTandyFineRaceBinding(address=>{reads.push(address);return 128;},{sampleRate,clockHz:3579545,divisor:1,volume:0,initialByte:128,decodeByte:b=>(b-128)/128,sampleGain:1,grant:()=>true,
  bios(request,_tick,bus){
   events.push(`enter:${request.ax}`);assert.equal(bus.play(request).carry,false);
   if(request.ax===0x8300){
    bus.advance(1);assert.equal(bus.serviceInterrupt(false),false);
    assert.equal(bus.serviceInterrupt(true),true);assert.equal(complete,1);
    assert.equal(bus.status().carry,false);
   }
   events.push(`return:${request.ax}`);return true;
  },completion(){complete++;events.push('completion');},toneWrites(){}});
 function* program(){try{
  yield {writes:[],sampleStarts:[],bios:[{ax:0x8300,es:0,bx:0,cx:1,dx:1}]};
  events.push('cpu-resumed');
  yield {writes:[],sampleStarts:[],bios:[{ax:0x8307,es:0,bx:1,cx:2,dx:123}]};
  return {writes:[],bios:[]};
 }finally{released=true;}}
 binding.start(program());
 assert.deepEqual(events,['enter:33536','completion','return:33536','cpu-resumed','enter:33543','return:33543']);
 assert.equal(binding.waiting,false);assert.equal(released,true);assert.deepEqual(reads,[0]);
 binding.advance(246);assert.deepEqual(reads,[0,1,2]);
 assert.equal(binding.serviceInterrupt(true),true);assert.equal(complete,2);
 binding.close();assert.equal(binding.waiting,false);
}
console.log('Both rates preserve completion-before-BIOS-return followed by accepted full playback; explicit ordering regression, no guessed BIOS duration');
for(const action of ['cancel','throw'] as const){
 let released=false,calls=0,resumed=false,retained:LegacyTandyFineBus|undefined;
 const reads:number[]=[];
 const binding=createLegacyTandyFineRaceBinding(address=>{reads.push(address);return 128;},{sampleRate:48000,clockHz:3579545,divisor:1,volume:0,initialByte:128,decodeByte:b=>(b-128)/128,sampleGain:1,grant:()=>true,
  bios(request,_tick,bus){calls++;retained=bus;assert.equal(bus.play(request).carry,false);bus.advance(1);bus.serviceInterrupt(true);return true;},
  completion(){if(action==='cancel')binding.close();else throw Error('Injected pre-return completion failure');},toneWrites(){}});
 function* program(){try{
  yield {writes:[],sampleStarts:[],bios:[{ax:0x8300,es:0,bx:0,cx:1,dx:1}]};
  resumed=true;yield {writes:[],sampleStarts:[],bios:[{ax:0x8307,es:0,bx:1,cx:1,dx:123}]};
  return {writes:[],bios:[]};
 }finally{released=true;}}
 assert.throws(()=>binding.start(program()),action==='throw'?/Injected pre-return completion failure/:/unavailable/);
 assert.equal(released,true);assert.equal(resumed,false);assert.equal(calls,1);assert.deepEqual(reads,[0]);
 assert.equal(binding.waiting,false);assert.equal(binding.waitingForBiosReturn,false);
 assert.throws(()=>retained!.play({ax:0x8307,es:0,bx:1,cx:1,dx:123}),/unavailable/);
 assert.throws(()=>binding.advance(1),/unavailable/);assert.deepEqual(reads,[0]);binding.close();
}
console.log('Cancellation and callback fault during pre-return completion release CPU continuation, prevent second playback and revoke retained bus without further reads');
