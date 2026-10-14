import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createControlledOriginalTandyMusic} from '../lib/game/controlled-tandy-music.ts';
import {createOriginalTandyToneStream,createOriginalTandyToneAudio} from '../lib/game/tandy-tone-audio.ts';

const options={variant:'pssj3' as const,clockHz:3579545,psgGain:0.5,speakerGain:1};
// The shipped tone backend must never make unsupported sample audio appear
// successfully rendered. A zero boot latch is distinct from audible DAC use.
for(const rate of [44100,48000]){
 const tone=createOriginalTandyToneAudio(rate,options);
 assert.doesNotThrow(()=>tone.write(0xc4,0));
 for(const [port,value] of [[0xc4,1],[0xc6,0],[0xc6,128],[0xc7,255]])assert.throws(()=>tone.write(port,value),/sample hardware scheduler/);
 const bios={ax:0x8300,es:0x9000,bx:0,cx:8000,dx:1};
 let callbacks=0;
 const stream=createOriginalTandyToneStream({tick:()=>{callbacks++;return {writes:[],bios:[bios]};}},[],rate,options);
 // The original PIT period is slightly longer than 10 ms. Cross its actual
 // boundary instead of assuming a rounded 100 Hz callback clock.
 assert.throws(()=>stream.render(rate/50),/DAC backend/);
 assert.equal(callbacks,1,'The rejection must come from an executed BIOS request');
}
let samples=0;
for(const name of ['titl','slct','vict','over']){
 const source=readFileSync(`public/game/tandy-music-${name}-seed.json`,'utf8');
 for(const generation of ['ms-1990','ms-1991'] as const){
  for(const rate of [44100,48000]){
   const render=(chunked:boolean)=>{
    const seed=JSON.parse(source),runtime=createControlledOriginalTandyMusic(seed,generation);
    const stream=createOriginalTandyToneStream({tick:()=>runtime.tick(0)},runtime.runtime.initialWrites,rate,options);
    const length=rate*4,pcm=new Float32Array(length);
    let at=0,index=0;
    while(at<length){const size=Math.min(chunked?[17,512,333,4096,1][index++%5]:length,length-at);pcm.set(stream.render(size),at);at+=size;}
    return {pcm,runtime};
   };
   const whole=render(false),chunks=render(true);
   assert.deepEqual(chunks.pcm,whole.pcm,`${generation}/${name}/${rate}: buffer partition must not alter PCM`);
   assert.deepEqual(chunks.runtime.runtime.driver,whole.runtime.runtime.driver);
   assert.deepEqual(chunks.runtime.runtime.timers,whole.runtime.runtime.timers);
   assert.deepEqual(chunks.runtime.runtime.voices,whole.runtime.runtime.voices);
   assert(whole.pcm.every(Number.isFinite),'No invalid output samples');
   assert(whole.pcm.some(value=>value!==0),'Score must produce sound');
   samples+=whole.pcm.length;
   console.log(`${generation}/${name}/${rate}: ${whole.pcm.length} finite samples, partition-exact SHA256 ${createHash('sha256').update(new Uint8Array(whole.pcm.buffer)).digest('hex')}`);
  }
 }
 assert.equal(readFileSync(`public/game/tandy-music-${name}-seed.json`,'utf8'),source);
}
console.log(`${samples} Tandy PCM samples checked across both generations, four scores and two sample rates; source seeds unchanged. Offline synthesis only, not browser or vintage hardware verification.`);
