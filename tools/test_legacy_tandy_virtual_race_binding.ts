import assert from 'node:assert/strict';
import {createLegacyTandyVirtualRaceBinding} from '../lib/game/legacy-tandy-virtual-race-binding.ts';
for(const rate of [44100,48000]){
 function fixture(){let completions=0;const reads:number[]=[];
  const binding=createLegacyTandyVirtualRaceBinding(address=>{reads.push(address);return address%2?255:128;},{sampleRate:rate,clockHz:3579545,divisor:123,volume:0,initialByte:128,decodeByte:b=>(b-128)/128,sampleGain:1,completion(){completions++;},toneWrites(){}});
  function* program(){yield {writes:[],sampleStarts:[],bios:[{ax:0x8300,es:0,bx:0,cx:1,dx:1}]};assert.equal(completions,1);yield {writes:[],sampleStarts:[],bios:[{ax:0x8307,es:0,bx:1,cx:4,dx:123}]};return {writes:[],bios:[]};}
  binding.start(program());assert.equal(binding.waiting,false);assert.deepEqual(reads,[0]);assert.equal(binding.snapshot().device.clock.tick,1);
  return {binding,reads,count:()=>completions};
 }
 const whole=fixture(),split=fixture();
 assert.deepEqual([...whole.binding.render(100)],[...split.binding.render(1),...split.binding.render(9),...split.binding.render(90)]);
 assert.deepEqual(whole.binding.snapshot(),split.binding.snapshot());assert.deepEqual(whole.reads,[0,1,2,3,4]);assert.equal(whole.count(),2);
 assert.equal(whole.binding.snapshot().device.clock.tick,Math.ceil(100*3579545/rate));
 whole.binding.close();split.binding.close();assert.throws(()=>whole.binding.render(1),/unavailable/);
}
console.log('Opt-in virtual adapter derives muted-reset completion from next device event, services later completion automatically and preserves split PCM without double-counting callback time');
for(const rate of [44100,48000]){
 const reads:number[]=[];let completions=0;
 const options={sampleRate:rate,clockHz:3579545,divisor:1,volume:0,initialByte:128,decodeByte:(b:number)=>(b-128)/128,sampleGain:1,
  completion(_ax:number,_tick:number,bus:import('../lib/game/legacy-tandy-fine-race-binding.ts').LegacyTandyFineBus){if(++completions===1)assert.equal(bus.play({ax:0x8307,es:0,bx:3,cx:2,dx:3}).carry,false);},toneWrites(){}};
 const binding=createLegacyTandyVirtualRaceBinding(address=>{reads.push(address);return 128;},options);
 function* program(){yield {writes:[],sampleStarts:[],bios:[{ax:0x8307,es:0,bx:0xffff,cx:2,dx:1}]};return {writes:[],bios:[]};}
 binding.start(program());binding.advance(1); // Pending intermediate segment at render entry.
 const before=binding.snapshot();assert.throws(()=>binding.render(-1),/Invalid/);assert.deepEqual(binding.snapshot(),before);
 options.sampleRate=8000;options.clockHz=1; // Retained caller options cannot change coverage.
 binding.render(10);assert.deepEqual(reads,[0xffff,0x10000,3,4]);assert.equal(completions,2);
 assert.equal(binding.snapshot().device.clock.tick,Math.ceil(10*3579545/rate));
 const count=reads.length;binding.render(10000);assert.equal(reads.length,count);assert.equal(completions,2);
 binding.close();
}
console.log('Virtual adapter services pending64KiB IRQ at render entry, callback repeat once, snapshots clock profile and skips idle time without reads; invalid spans preserve state');
