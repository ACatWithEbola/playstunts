import assert from 'node:assert/strict';
import {createLegacyTandyFineRaceBinding} from '../lib/game/legacy-tandy-fine-race-binding.ts';
import {createTandyChipToneProjection} from '../lib/game/tandy-chip-tone-projection.ts';
function fixture(rate:number,mixed:boolean){
 const profile={variant:'pssj3' as const,clockHz:3579545,psgGain:0.5,speakerGain:1},reference=createTandyChipToneProjection(rate,profile);
 const binding=createLegacyTandyFineRaceBinding(address=>[0,255,64,192][address],{sampleRate:rate,clockHz:3579545,divisor:123,volume:0,initialByte:128,decodeByte:value=>(value-128)/128,sampleGain:0.5,grant:()=>true,tone:mixed?profile:undefined,
  bios(request,_tick,bus){assert.equal(bus.play(request).carry,false);return true;},completion(){},toneWrites(writes,tick){for(const [port,value] of writes)reference.write(tick,port,value);}});
 function* start(){yield {writes:[[0xc0,0x84],[0xc1,8],[0xc0,0x90],[0xc0,0xbf],[0xc0,0xdf],[0xc0,0xff],[0x43,0xb6],[0x42,0x98],[0x42,0xa],[0x61,3]],sampleStarts:[],bios:[{ax:0x8307,es:0,bx:0,cx:4,dx:123}]};return {writes:[],bios:[]};}
 binding.start(start());assert.equal(binding.port61,3,'CPU sees current port state before rendering catches up');
 binding.advance(20000);binding.serviceInterrupt(true);
 return {binding,reference};
}
for(const rate of [44100,48000]){
 const base=fixture(rate,false),mixed=fixture(rate,true),split=fixture(rate,true),sample=base.binding.render(100),tones=base.reference.render(100,20000);
 const expected=Float32Array.from(sample,(value,index)=>value+tones[index]);
 assert.deepEqual(mixed.binding.render(100),expected);assert.deepEqual([...split.binding.render(1),...split.binding.render(9),...split.binding.render(90)],[...expected]);
 assert.deepEqual(split.binding.snapshot(),mixed.binding.snapshot());assert.ok(expected.every(Number.isFinite));assert.ok(tones.some(value=>value!==0));
 for(const fixture of [base,mixed,split]){fixture.binding.close();fixture.reference.close();}
}
console.log('Fine race mix equals independently summed sample and PSG/PIT output exactly across rates/splits; live port61 visible before queued audio render, no duplicate mixing');
