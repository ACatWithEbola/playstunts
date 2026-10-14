import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import createMunt from '../public/game/mt32-local/munt.mjs';
import {createMt32WasmOutput,type Mt32Wasm} from '../lib/game/mt32-wasm-output.ts';
import {createOwnedTimedMt32Device} from '../lib/game/owned-timed-mt32-device.ts';
import {createTimedMt32ScoreStream} from '../lib/game/timed-mt32-score-stream.ts';
import {versionedMt32MusicSeed} from '../lib/game/versioned-mt32-music-seed.ts';
import {PC_PIT_INPUT_HZ,ORIGINAL_PIT_DIVISOR} from '../lib/game/timer-interrupt.ts';
import {initializeTimedMt32Device} from '../lib/game/timed-mt32-startup.ts';
import {settleMt32Startup} from '../lib/game/mt32-startup-settle.ts';
const control=readFileSync('public/game/mt32-local/ctrl_mt32_1_07.rom'),pcm=readFileSync('public/game/mt32-local/pcm_mt32.rom'),wasm=readFileSync('public/game/mt32-local/munt.wasm'),patch=readFileSync('public/game/original-resources/MT32.PLB');
const openingDirectory=process.argv[2];
if(openingDirectory&&(!openingDirectory.startsWith('/private/tmp/ms91-roland-openings.')||!existsSync(openingDirectory)))throw Error('Opening exports require a new temporary proof directory');
for(const generation of ['ms-1990','ms-1991'] as const)for(const score of ['titl','slct','vict','over']){
 const path=`public/game/mt32-music-${score}-seed.json`,source=readFileSync(path,'utf8'),seed=versionedMt32MusicSeed(JSON.parse(source),generation);
 const diagnostics:string[]=[];
 const module=await createMunt({wasmBinary:wasm,print:(message:string)=>diagnostics.push(message),printErr:(message:string)=>diagnostics.push(message)});
 const device=createMt32WasmOutput(module as unknown as Mt32Wasm,control,pcm);
 try{
  assert.equal(device.settings()[5],1,'Bundled Munt already delays short MIDI messages; transport must not double-count cable delay');
  // Explicit test profile: nominal 8086 loop plus synthetic polling cost.
  // This does not model full bus/interrupt costs or prove a production speed.
  const bridge=createOwnedTimedMt32Device(device,{cpuHz:4772728,pollCycles:20,
   resetClocks:Math.ceil(0.014*PC_PIT_INPUT_HZ),initialPort61:0,
   interrupts(){},cancelled:()=>false,yieldTask:async()=>{},
  });
  await initializeTimedMt32Device(Uint8Array.from(seed.driver),patch,generation,bridge);
  assert.ok(bridge.now()>=Math.floor(1179636*PC_PIT_INPUT_HZ/4772728),'Actual startup CPU loop must advance synthesis timeline');
  await settleMt32Startup({sampleRate:device.sampleRate,active:()=>device.active(),render:frames=>bridge.output.render(frames)},()=>false,bridge.yieldTask);
  assert.equal(device.active(),false,'No delayed startup messages or old tail remain before score start');
  assert.equal(device.read(0x40016,1)[0],100);
  const stream=await createTimedMt32ScoreStream(seed,bridge.output,bridge.transport);
  // Score initialWrites contains sixteen Reset All Controllers messages.
  // Their device-side delays must finish before the first music IRQ.
  bridge.output.render(512);
  await settleMt32Startup({sampleRate:device.sampleRate,active:()=>device.active(),render:frames=>bridge.output.render(frames)},()=>false,bridge.yieldTask);
  assert.equal(device.active(),false,'Score controller resets finish before its first tick');
  let nonzero=0,maxClockLead=0;const openingSamples=new Float32Array(device.sampleRate*2*2);let copied=0;
  for(let frame=0;frame<device.sampleRate*4;frame+=512){
   const samples=await stream.render(Math.min(512,device.sampleRate*4-frame));
   assert.ok(samples.every(Number.isFinite));nonzero+=samples.filter(value=>value!==0).length;
   if(copied<openingSamples.length){const count=Math.min(samples.length,openingSamples.length-copied);openingSamples.set(samples.subarray(0,count),copied);copied+=count;}
   maxClockLead=Math.max(maxClockLead,bridge.now()-Math.ceil(bridge.frame*PC_PIT_INPUT_HZ/device.sampleRate));
  }
  assert.ok(nonzero>0,`${generation}/${score} must generate actual synthesizer output`);
  if(openingDirectory&&(score==='titl'||score==='slct')){
   const path=join(openingDirectory,`${generation}-${score}.wav`);if(existsSync(path))throw Error('Refusing to overwrite audio proof');
   const wav=Buffer.alloc(44+openingSamples.length*2);wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(device.sampleRate,24);wav.writeUInt32LE(device.sampleRate*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(openingSamples.length*2,40);
   openingSamples.forEach((value,index)=>wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,value))*32767),44+index*2));writeFileSync(path,wav,{flag:'wx'});
   console.log('Unprocessed two-second stereo opening: '+path);
  }
  console.log(`${generation}/${score}: maximum transport lead ${maxClockLead} PIT clocks ahead of rendered audio`);
  await stream.control('pause-audio');assert.equal(stream.settings.paused,1);
  // Controls commit after transport scheduling; explicitly drain the timed
  // packets before inspecting actual device memory, not just controller state.
  bridge.output.render(4096);
  assert.equal(device.read(0x40016,1)[0],0,'Pause packet must reach real synthesizer system volume');
  await stream.control('resume-audio');assert.equal(stream.settings.paused,0);
  bridge.output.render(4096);
  assert.equal(device.read(0x40016,1)[0],100,'Resume packet must restore real synthesizer system volume');
  let stopped=0,waits=0;
  await stream.fadeOut(async ticks=>{
   waits++;let frames=Math.ceil(ticks*ORIGINAL_PIT_DIVISOR*device.sampleRate/PC_PIT_INPUT_HZ);
   while(frames){const count=Math.min(512,frames);await stream.render(count);frames-=count;}
  },()=>{stopped++;});
  assert.equal(stopped,1);assert.equal(waits,51);
  bridge.output.render(4096);
  assert.equal(device.read(0x40016,1)[0],100,'Original fade restores actual device volume after stopping music');
  await stream.control('pause-audio');
  assert.equal(device.read(0x40016,1)[0],100,'Queued pause is not delivered ahead of its sample timeline');
  stream.close();assert.throws(()=>stream.render(512),/cancelled/);
  bridge.close();assert.throws(()=>bridge.output.render(512),/cancelled/);
  // The synthesizer remains owned by the parent and may be reused. Rendering
  // it directly after timeline disposal must not resurrect queued old MIDI.
  for(let frame=0;frame<4096;frame+=512)assert.ok(device.render(512).every(Number.isFinite));
  assert.equal(device.read(0x40016,1)[0],100,'Disposed pause cannot mute subsequent device playback');
  if(score==='titl'){
   const menu=versionedMt32MusicSeed(JSON.parse(readFileSync('public/game/mt32-music-slct-seed.json','utf8')),generation);
   const nextOwner=createOwnedTimedMt32Device(device,{cpuHz:4772728,pollCycles:20,resetClocks:Math.ceil(.014*PC_PIT_INPUT_HZ),initialPort61:0,interrupts(){},cancelled:()=>false,yieldTask:async()=>{}});
   await initializeTimedMt32Device(Uint8Array.from(menu.driver),patch,generation,nextOwner);
   const settle=()=>settleMt32Startup({sampleRate:device.sampleRate,active:()=>device.active(),render:frames=>nextOwner.output.render(frames)},()=>false,nextOwner.yieldTask);
   await settle();assert.equal(device.active(),false,'Prior title tail must settle before Menu');
   const nextScore=await createTimedMt32ScoreStream(menu,nextOwner.output,nextOwner.transport);
   nextOwner.output.render(512);await settle();assert.equal(device.active(),false);
   let sounding=0;for(let frames=0;frames<device.sampleRate;frames+=512){const pcm=await nextScore.render(Math.min(512,device.sampleRate-frames));assert.ok(pcm.every(Number.isFinite));sounding+=pcm.filter(value=>value!==0).length;}
   assert.ok(sounding>0,'Menu must sound on reused title synthesizer');
   nextScore.close();nextOwner.close();
   console.log(`${generation}: Title-to-Menu reuses synthesizer with settled old tail and fresh controller reset`);
  }
  assert.equal(readFileSync(path,'utf8'),source);
  console.log(`${generation}/${score}: ${nonzero} nonzero stereo samples; ${diagnostics.length} synthesizer diagnostics retained`);
  for(const message of diagnostics)console.log(`${generation}/${score}: ${message}`);
 }finally{device.close();}
}
assert.deepEqual(readFileSync('public/game/original-resources/MT32.PLB'),patch);
console.log('Eight owned score streams pass actual Munt synthesis through shared sample-timed transport; virtual CPU policy, not original timing or browser listening acceptance');
