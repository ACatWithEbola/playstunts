import assert from 'node:assert/strict';
import {createLegacyTandyDmaClockOwner} from '../lib/game/legacy-tandy-dma-clock-owner.ts';
import {createTandyDacSampleClock} from '../lib/game/tandy-dac-sample-clock.ts';
import {createLegacyTandyMixedAudio} from '../lib/game/legacy-tandy-mixed-audio.ts';
for(const sampleRate of [44100,48000]){
 function fixture(){
  const profile={sampleRate,clockHz:3579545,divisor:123,volume:7},reads:number[]=[],requests:number[]=[];
  let bus:Parameters<Parameters<typeof createLegacyTandyMixedAudio>[1]['gameInterrupt']>[1]|undefined;
  const owner=createLegacyTandyDmaClockOwner(profile,frame=>{requests.push(frame);assert.ok(bus);bus.grantDma();return true;});
  const mixed=createLegacyTandyMixedAudio(address=>{reads.push(address);return address&255;},{sampleRate,tone:{variant:'pssj3',clockHz:3579545,psgGain:0,speakerGain:0},sampleGain:1,initialByte:128,initialVolume:0,decodeByte:value=>(value-128)/128,completion(){},gameInterrupt(frame,current){bus=current;try{owner.service(frame);if(frame===10){owner.write(0xc6,100);bus.write([[0xc6,100]]);}}finally{bus=undefined;}}});
  mixed.scheduleBios(0,{ax:0x8307,es:0,bx:0,cx:1000,dx:123});
  for(let frame=1;frame<=2000;frame++)mixed.scheduleGameInterrupt(frame);
  return {mixed,owner,reads,requests,profile};
 }
 const whole=fixture(),split=fixture();
 const expected=whole.mixed.render(2000),actual:number[]=[];
 for(const frames of [1,9,17,973,1000])actual.push(...split.mixed.render(frames));
 assert.deepEqual(actual,[...expected]);assert.deepEqual(split.reads,whole.reads);assert.equal(whole.reads.length,1000);
 const reference=createTandyDacSampleClock(sampleRate,3579545,123,7),edges=reference.advance(10);reference.write(0xc6,100);
 assert.deepEqual(whole.requests,[...edges,...reference.advance(1990).map(frame=>frame+10)]);
 assert.deepEqual(split.owner.snapshot(),whole.owner.snapshot());
 for(const item of [whole,split]){item.owner.close();item.mixed.close();assert.throws(()=>item.owner.service(2001),/unavailable/);}
}
let delivered=0;
for(const sampleRate of [44100,48000]){
 const programmed=createTandyDacSampleClock(sampleRate,3579545,123,7),ports=createTandyDacSampleClock(sampleRate,3579545,123,7);
 assert.deepEqual(programmed.advance(17),ports.advance(17));
 const before=programmed.snapshot();assert.throws(()=>programmed.program(0,7),/divisor/);assert.deepEqual(programmed.snapshot(),before);
 programmed.program(356,3);ports.write(0xc6,100);ports.write(0xc7,(3<<5)|1);
 assert.deepEqual(programmed.snapshot(),ports.snapshot());assert.deepEqual(programmed.advance(1000),ports.advance(1000));
}
const guarded=createLegacyTandyDmaClockOwner({sampleRate:48000,clockHz:48000,divisor:1,volume:7},()=>{delivered++;return false;});
assert.throws(()=>guarded.service(2),/consecutive/);assert.equal(guarded.snapshot().frame,0);
guarded.service(1);assert.equal(delivered,1);assert.equal(guarded.snapshot().grants,0);guarded.close();
for(const mode of ['close','throw','invalid','reentry'] as const){
 let calls=0;
 const owner=createLegacyTandyDmaClockOwner({sampleRate:8000,clockHz:24000,divisor:1,volume:7},()=>{
  calls++;
  if(mode==='close')owner.close();
  if(mode==='throw')throw Error('Arbitration fault');
  if(mode==='invalid')return undefined as unknown as boolean;
  if(mode==='reentry'){
   assert.throws(()=>owner.service(2),/consecutive/);
   assert.throws(()=>owner.program(2,7),/during request/);
   assert.throws(()=>owner.write(0xc6,2),/during request/);
  }
  return true;
 });
 if(mode==='reentry'){owner.service(1);assert.equal(calls,3);assert.equal(owner.snapshot().grants,3);owner.close();}
 else{assert.throws(()=>owner.service(1),mode==='throw'?/Arbitration fault/:mode==='invalid'?/boolean/:/unavailable/);assert.equal(calls,1);assert.throws(()=>owner.service(2),/unavailable/);assert.equal(calls,1);}
}
console.log('Clock owner delivers calculated requests through owning DMA bus at both rates with exact split PCM; skipped boundaries and closed owners reject, denied arbitration transfers nothing');
