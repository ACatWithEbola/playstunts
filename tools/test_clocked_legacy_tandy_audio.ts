import assert from 'node:assert/strict';
import {createTandyDacSampleClock} from '../lib/game/tandy-dac-sample-clock.ts';
import {createLegacyTandyMixedAudio} from '../lib/game/legacy-tandy-mixed-audio.ts';
function fixture(rate:number){
 const memory=Uint8Array.from({length:0x100000},(_,i)=>i&255),reads:number[]=[],completions:number[]=[];
 const clock=createTandyDacSampleClock(rate,3579545,123,7);
 const mixed=createLegacyTandyMixedAudio(address=>{reads.push(address);return memory[address];},{sampleRate:rate,tone:{variant:'pssj3',clockHz:3579545,psgGain:0,speakerGain:0},sampleGain:1,initialByte:128,initialVolume:0,decodeByte:b=>(b-128)/128,deferCompletionInterrupts:true,
  completion(ax,frame){assert.equal(ax,0x91fb);completions.push(frame);},gameInterrupt(){}});
 mixed.scheduleBios(0,{ax:0x8307,es:0x3000,bx:0,cx:1000,dx:123});
 const edges=clock.advance(10);for(const frame of edges)mixed.scheduleDma(frame);
 // Explicit bus order: all chip requests through10 precede the register write.
 mixed.scheduleWrites(10,[[0xc6,100]]);clock.write(0xc6,100);
 for(const offset of clock.advance(1990)){edges.push(offset+10);mixed.scheduleDma(offset+10);}
 mixed.scheduleCompletionInterrupt(2001);
 return {mixed,reads,completions,edges,memory};
}
for(const rate of [44100,48000]){
 const whole=fixture(rate),split=fixture(rate),expected=whole.mixed.render(2002),actual:number[]=[];
 for(const count of [1,9,1,17,1952,1,21])actual.push(...split.mixed.render(count));
 assert.deepEqual(actual,Array.from(expected));assert.deepEqual(split.reads,whole.reads);assert.equal(whole.reads.length,1000);
 assert.deepEqual(whole.reads,Array.from({length:1000},(_,i)=>0x30000+i));
 assert.deepEqual(whole.completions,[2001]);assert.deepEqual(split.completions,whole.completions);
 assert.equal(whole.mixed.pendingCompletionInterrupts,0);
 let consumed=0,value=0;
 for(let frame=0;frame<2002;frame++){
  while(consumed<1000&&whole.edges[consumed]<=frame){value=(whole.memory[0x30000+consumed]-128)/128;consumed++;}
  assert.equal(expected[frame],value,'PCM holds the last granted byte at the supplied request position');
 }
 whole.mixed.close();split.mixed.close();
}
console.log('Clock-generated legacy DMA fixture preserves1000 live bytes, register-change positions, held PCM and one deferred completion across audio rates/buffer splits; grants explicit, not physical firmware proof');
