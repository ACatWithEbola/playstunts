import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {ms91SunoMusic} from '../lib/game/ms91-suno-music.ts';
import createMunt from '../public/game/mt32-local/munt.mjs';
import {createMt32WasmOutput,type Mt32Wasm} from '../lib/game/mt32-wasm-output.ts';
import {createTimedMt32SongFactory} from '../lib/game/timed-mt32-song-factory.ts';
import {createNativeTimedMt32Music} from '../lib/game/native-timed-mt32-music.ts';
import {createClockOwnedTimedMusic} from '../lib/game/clock-owned-timed-music.ts';
import {createRetainedMenuClockOwner} from '../lib/game/retained-menu-clock-owner.ts';
import {createSynchronizedRemixedMusic} from '../lib/game/remixed-music.ts';
import {browserMs91SunoScorePreview} from './ms91-suno-research-profile.ts';
import {PC_PIT_INPUT_HZ,ORIGINAL_PIT_DIVISOR} from '../lib/game/timer-interrupt.ts';
import type {OriginalMt32MusicSeed} from '../lib/game/mt32-music-runtime.ts';
const names=['titl','slct','vict','over'] as const;
const deliveryProfile=process.argv.includes('--delivery-profile');
const withRemix=process.argv.includes('--remix');
const continuousOriginal=process.argv.includes('--continuous-original');
if(continuousOriginal&&withRemix)throw Error('Continuous Original regression must not change Updated fade');
const packaged=process.argv.includes('--packaged');
const actualSuno=process.argv.includes('--actual-suno')||packaged;
if(actualSuno&&!withRemix)throw Error('Actual Suno test requires remix wrapper');
const wallClock=process.argv.includes('--wall-clock')||deliveryProfile;
const seeds=Object.fromEntries(names.map(name=>[name,JSON.parse(readFileSync(`public/game/mt32-music-${name}-seed.json`,'utf8'))])) as Record<typeof names[number],OriginalMt32MusicSeed>;
const control=readFileSync('public/game/mt32-local/ctrl_mt32_1_07.rom'),pcm=readFileSync('public/game/mt32-local/pcm_mt32.rom'),wasm=readFileSync('public/game/mt32-local/munt.wasm'),patch=readFileSync('public/game/original-resources/MT32.PLB');
const scoreOption=process.argv.find(value=>value.startsWith('--score='))?.slice(8);
const generationOption=process.argv.find(value=>value.startsWith('--generation='))?.slice(13);
const repeats=Number(process.argv.find(value=>value.startsWith('--repeat='))?.slice(9)??1);
if(scoreOption&&!names.includes(scoreOption as typeof names[number]))throw Error('Invalid score selection');
if(generationOption&&!['ms-1990','ms-1991'].includes(generationOption))throw Error('Invalid generation selection');
if(!Number.isSafeInteger(repeats)||repeats<1||repeats>10)throw Error('Repeat count must be1..10');
const checkedScores=scoreOption?[scoreOption as typeof names[number]]:process.argv.includes('--all-scores')?names:['slct'] as const;
const generations=generationOption?[generationOption as 'ms-1990'|'ms-1991']:['ms-1990','ms-1991'] as const;
for(let repetition=1;repetition<=repeats;repetition++)for(const generation of generations)for(const checkedScore of checkedScores){
 const module=await createMunt({wasmBinary:wasm,print(){},printErr(){}});
 const device=createMt32WasmOutput(module as unknown as Mt32Wasm,control,pcm);
 let wall=0,audioTime=0,nonzero=0,waits=0,finalWait=false,guardedRun=0,maxGuardedRun=0;
 const startedAt=performance.now();
 const clock=createRetainedMenuClockOwner({callbackCounter:0,gameCounter:0,divisor:5,countdown:5},()=>wall);
 const gainEvents:{value:number;at:number}[][]=[];
 const context={get currentTime(){return wallClock?(performance.now()-startedAt)/1000:audioTime;},state:'running',destination:{},
  createGain(){const events:{value:number;at:number}[]=[];gainEvents.push(events);return {gain:{value:1,cancelScheduledValues(){},setValueAtTime(value:number,at:number){events.push({value,at});},linearRampToValueAtTime(){}},connect(){},disconnect(){}};},
  createBuffer(_channels:number,frames:number){return {getChannelData:()=>new Float32Array(frames)};},
  createBufferSource(){return {buffer:null,onended:null,connect(){},start(){},stop(){},disconnect(){}};},
 } as unknown as AudioContext;
 const output={...device,render(frames:number){const samples=device.render(frames);nonzero+=samples.filter(value=>value!==0).length;return samples;}};
 const factory=createTimedMt32SongFactory(output,seeds,patch,generation,{cpuHz:4772728,pollCycles:20,resetClocks:Math.ceil(.014*PC_PIT_INPUT_HZ),initialPort61:0,interrupts(){},yieldTask:wallClock?()=>new Promise(resolve=>setTimeout(resolve,0)):async()=>{}},dispatch=>{guardedRun=dispatch?0:guardedRun+1;maxGuardedRun=Math.max(maxGuardedRun,guardedRun);clock.audioTick();});
 let latestScore:Awaited<ReturnType<typeof factory>>['score']|undefined;
 let firstReady:{counter:number;at:number}|undefined;
 const overshoot:{step:number;ticks:number;milliseconds:number}[]=[];
 const player=createNativeTimedMt32Music(context,async(name,cancelled)=>{const owned=await factory(name,cancelled);latestScore=owned.score;
  if(!deliveryProfile)return owned;
  return {...owned,score:{...owned.score,get renderedFrame(){return owned.score.renderedFrame;},get settings(){return owned.score.settings;},get deliveryReady(){return owned.score.deliveryReady;},async render(frames:number){const readyBefore=owned.score.deliveryReady;const samples=await owned.score.render(frames);if(!readyBefore&&owned.score.deliveryReady)firstReady={counter:clock.inputClock.counter(),at:performance.now()};return samples;}}};
 });
 const music=createClockOwnedTimedMusic(player,clock);
 const sunoProfile=actualSuno&&generation==='ms-1991'?(packaged?ms91SunoMusic(generation):browserMs91SunoScorePreview(generation,{hostname:'localhost',search:'?preview-suno-score=1'})):undefined;
 let remixBuffer={duration:100} as AudioBuffer;
 if(sunoProfile){
  let data:Uint8Array|undefined;
  if(packaged){
   data=execFileSync('ffmpeg',['-v','error','-i','public'+sunoProfile.paths[checkedScore],'-ar','48000','-ac','2','-f','f32le','pipe:1'],{maxBuffer:64*1024*1024});
  }else{
  const path='/private/tmp/'+new URL(sunoProfile.paths[checkedScore]).pathname.slice('/files/'.length),bytes=readFileSync(path);
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),ascii=(start:number,end:number)=>new TextDecoder().decode(bytes.subarray(start,end));
  assert.equal(ascii(8,12),'WAVE');assert.equal(view.getUint16(20,true),3);assert.equal(view.getUint16(22,true),2);assert.equal(view.getUint32(24,true),48000);assert.equal(view.getUint16(34,true),32);
  // FFmpeg can include ancillary chunks, so locate PCM instead of assuming44.
  let offset=12;
  while(offset+8<=bytes.length){const size=view.getUint32(offset+4,true);assert.ok(offset+8+size<=bytes.length);if(ascii(offset,offset+4)==='data'){data=bytes.subarray(offset+8,offset+8+size);break;}offset+=8+size+(size&1);}
  }
  assert.ok(data&&data.length%8===0);
  const pcmView=new DataView(data.buffer,data.byteOffset,data.byteLength);
  for(let i=0;i<data.length;i+=4)assert.ok(Number.isFinite(pcmView.getFloat32(i,true)));
  remixBuffer={duration:data.length/8/48000,sampleRate:48000,length:data.length/8} as AudioBuffer;
  assert.ok(remixBuffer.duration>sunoProfile.timing[checkedScore].introDuration!+sunoProfile.timing[checkedScore].loopDuration);
 }
 const remix=withRemix?createSynchronizedRemixedMusic(context,music as never,{[checkedScore]:remixBuffer},true,sunoProfile?.timing,{scheduledFade:true}):undefined;
 const browserClock=setInterval(()=>{audioTime+=.005;},5);
 try{
  if(remix)await remix.playAsync(checkedScore);else await music.playAsync(checkedScore);assert.equal(clock.source,'audio');
  if(process.argv.includes('--pause-resume')){
   if(remix)await remix.controlAsync('pause-audio');else await music.controlAsync('pause-audio');
   assert.equal(clock.source,'wall');wall+=20;audioTime+=.2;
   if(remix)await remix.controlAsync('resume-audio');else await music.controlAsync('resume-audio');
   assert.equal(clock.source,'audio');
  }
  const fadeAt=performance.now();
  if(continuousOriginal){guardedRun=0;maxGuardedRun=0;}
  const fadeEventStart=gainEvents[1]?.length??0;
  const fadeValues:number[]=[],fadeTimes:number[]=[];let observedStop=false;
  const wait=async(ticks:number)=>{
   waits++;
   if(clock.source==='wall'){assert.equal(ticks,50);finalWait=true;if(wallClock)await new Promise(resolve=>setTimeout(resolve,ticks*ORIGINAL_PIT_DIVISOR/PC_PIT_INPUT_HZ*1000));wall+=ticks;clock.inputClock.counter();return;}
   assert.equal(ticks,continuousOriginal?100:2);if(!continuousOriginal)assert.equal(latestScore!.deliveryReady,true,'Original delay must start after delivery catches command return time');const target=clock.inputClock.counter()+ticks;
   if(deliveryProfile&&firstReady){overshoot.push({step:waits,ticks:clock.inputClock.counter()-firstReady.counter,milliseconds:performance.now()-firstReady.at});firstReady=undefined;}
   if(!wallClock)audioTime+=ticks*ORIGINAL_PIT_DIVISOR/PC_PIT_INPUT_HZ;
   const deadline=Date.now()+5000;
   while(clock.inputClock.counter()<target){if(Date.now()>deadline)throw Error(`Timed fade clock failed to advance: wait=${waits}, current=${clock.inputClock.counter()}, target=${target}, time=${audioTime}, failure=${String(player.failure)}`);if(!wallClock)audioTime+=.001;await new Promise(resolve=>setTimeout(resolve,1));}
  };
  if(continuousOriginal){await music.fadeOutContinuous(wait);assert.ok(maxGuardedRun<10,`Fade must not introduce long SysEx callback suppression: ${maxGuardedRun}`);}
  else if(remix){await remix.fadeOut(wait);const events=gainEvents[1].slice(fadeEventStart,fadeEventStart+50);assert.deepEqual(events.map(event=>event.value),Array.from({length:50},(_,index)=>(100-index*2)/100));assert.ok(events.every((event,index)=>!index||event.at>=events[index-1].at));assert.equal(gainEvents[1].at(-1)!.value,0);console.log(`${generation}: complete remix wrapper follows all50 scheduled original volume events; ${sunoProfile?'actual timing-edited Suno WAV layout':'fixture remix buffer'}, not audible alignment proof`);}
  else{await music.fadeOutObserved(wait,{volume(value,at){assert.ok(Number.isFinite(at));fadeValues.push(value);fadeTimes.push(at);},stopped(){observedStop=true;}});assert.deepEqual(fadeValues,Array.from({length:50},(_,index)=>100-index*2));assert.ok(observedStop);assert.ok(fadeTimes.every((at,index)=>!index||at>=fadeTimes[index-1]),'Command playback anchors retain original order');}
  assert.equal(waits,continuousOriginal?2:51);assert.equal(finalWait,true);assert.equal(clock.source,'wall');assert.equal(player.hasScore,false);
  if(player.deliveryDiagnostics.maxGapSeconds>0){
   const gap=player.deliveryDiagnostics.largestGap!;
   const previousEnd=gap.start-gap.gap;
   console.log(JSON.stringify({repetition,generation,score:checkedScore,failingDelivery:player.deliveryDiagnostics,renderDurationSeconds:gap.renderFinishedAt-gap.renderStartedAt,renderStartedRelativeToPreviousEnd:gap.renderStartedAt-previousEnd,renderFinishedRelativeToPreviousEnd:gap.renderFinishedAt-previousEnd}));
  }
  assert.equal(player.deliveryDiagnostics.maxGapSeconds,0,'Fade must not introduce a scheduled audio gap');
  console.log(JSON.stringify({repetition,generation,score:checkedScore,remix:withRemix,continuousOriginal,waits,fadeMaxGuardedRun:maxGuardedRun,scheduledBuffers:player.deliveryDiagnostics.scheduledBuffers,maxGapSeconds:player.deliveryDiagnostics.maxGapSeconds,scope:'Real synthesis with mocked WebAudio; not audible remix alignment'}));
  assert.ok(nonzero>0);assert.equal(device.active(),false);assert.ok(device.render(512).every(value=>value===0));
  if(wallClock)console.log(JSON.stringify({generation,fadeMilliseconds:+(performance.now()-fadeAt).toFixed(2),...player.deliveryDiagnostics,scope:'Real elapsed Node scheduling; mocked WebAudio, not browser listening'}));
  if(deliveryProfile)console.log(JSON.stringify({generation,readyCrossings:overshoot.length,overshootTicks:overshoot.reduce((total,step)=>total+step.ticks,0),maxOvershootTicks:Math.max(0,...overshoot.map(step=>step.ticks)),steps:overshoot,scope:'First ready rendered-buffer boundary to delay start, not exact intra-buffer return frame'}));
  await music.playAsync('titl');assert.equal(clock.source,'audio');await music.stopAsync();assert.equal(clock.source,'wall');
  console.log(`${generation}: real Munt fade completes ${continuousOriginal?2:51} waits, hands final50 ticks to wall clock, settles and restarts Title; startup-inclusive longest guarded run=${maxGuardedRun}, max scheduled gap=${player.deliveryDiagnostics.maxGapSeconds}; virtual browser scheduling, not listening proof`);
 }finally{clearInterval(browserClock);await music.closeAsync();device.close();}
}
