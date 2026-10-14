import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sampledTandyBrowserFixture} from './sampled_tandy_browser_fixture.ts';
import {createNativeDemoRuntime} from '../lib/game/native-demo-runtime.ts';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
import {advanceOriginalNestedHardwareClock} from '../lib/game/hardware-clock-memory.ts';
import {assertAllocatedRaceAudioIdle} from '../lib/game/advance-allocated-race.ts';
import {runTandySampleContinuation} from '../lib/game/run-tandy-sample-continuation.ts';
import {serviceSuppliedTandySilentRequests} from '../lib/game/supplied-tandy-bios.ts';
import {createLegacyTandyMixedAudio} from '../lib/game/legacy-tandy-mixed-audio.ts';
import {originalTandyDacGain} from '../lib/game/tandy-dac-transfer.ts';
import {completeOriginalTandySample} from '../lib/game/tandy-sample.ts';
import {createLegacyTandyContinuationPump} from '../lib/game/legacy-tandy-continuation-pump.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL'),d=0x2d1a0;
for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const mode of ['complete','cancel','failure'] as const){
 const runtime=await createNativeDemoRuntime({...sampledTandyBrowserFixture(),physicsEngine,experimental10Hz:true,demoReplay:versionedDemoResource(physicsEngine),soundDevice:{kind:'tandy',driverGeneration:'ms-1990',port61:()=>0,interruptCx:()=>0,bios:serviceSuppliedTandySilentRequests}},
  {configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'LEGACYDEMO',camera:0,graphics:2,soundEnabled:true});
 const live=()=>runtime.session.state.memory;
 runtime.audio.crash(new DataView(live().buffer).getUint16(d+0x8016,true));
 let held=false,release!:()=>void;const wait=new Promise<void>(resolve=>{release=resolve;}),controller=new AbortController();
 for(let tick=0;tick<20&&!held;tick++){
  const pending=runTandySampleContinuation(runtime.tickProgram(true),{
   write(){},async bios(batch,signal){if(!batch.length)return;assert.equal(signal,controller.signal);if(!batch.some(request=>request.es===0x1000&&request.bx===0x132&&request.cx===6))return;held=true;await wait;if(mode==='failure')throw Error('Demo BIOS delivery failed');
    if(mode==='complete'){
     // Explicit fixture DMA positions, not inferred BIOS execution latency.
     const completions:number[]=[],results:boolean[]=[],reads:number[]=[];
     const mixed=createLegacyTandyMixedAudio(address=>{reads.push(address);return live()[address];},{sampleRate:48000,tone:{variant:'pssj3',clockHz:3579545,psgGain:0,speakerGain:0},sampleGain:1,initialByte:128,initialVolume:0,decodeByte:value=>(value-128)/128,
      completion(ax,_frame,bus){
       completions.push(ax);
       const driver=live().subarray(0x39e10,0x39e10+2993),result=completeOriginalTandySample(driver,ax);
       assert.equal(result.chain,false,'DMA completion belongs to installed legacy sample handler');
       for(const request of result.bios)bus.play(request);
      },gameInterrupt(){assert.fail('No independent replay clock permitted');},biosResult(result){results.push(result.carry);}});
     let frame=0;
     for(const request of batch){mixed.scheduleBios(frame++,request);for(let byte=0;byte<request.cx;byte++)mixed.scheduleDma(frame++);}
     const beforeFrame=runtime.frame,pcm=mixed.render(frame+1);
     assert.deepEqual(reads.filter(address=>address>=0x10132&&address<0x10138),[0x10132,0x10133,0x10134,0x10135,0x10136,0x10137]);
     const last=batch.at(-1)!,lastByte=live()[last.es*16+last.bx+last.cx-1];
     assert.equal(pcm.at(-1),Math.fround((lastByte-128)/128*originalTandyDacGain(last.ax&255)),'Mixer must retain original requested volume, including a muted opening');
     assert.ok(pcm.every(Number.isFinite));assert.ok(results.every(carry=>!carry));assert.equal(completions.length,batch.length);assert.equal(runtime.frame,beforeFrame);
     mixed.close();
    }
   },
   async replaceSample(){assert.fail('Legacy replay must not use modern sample replacement');},
  },controller.signal);
  // Allow immediately returned BIOS calls to resume before inspecting the
  // explicitly held payload call; this is not a hardware-time estimate.
  for(let turn=0;turn<8&&!held;turn++)await Promise.resolve();
  if(!held){assert.equal(await pending,true);continue;}
  const memory=live(),view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),frame=runtime.frame,clock=view.getUint32(d+0x407a,true);
  assert.equal(memory[d+0x408e],1);
  assert.throws(()=>runtime.tick(),/pending audio continuation/);
  for(let edge=0;edge<5;edge++)advanceOriginalNestedHardwareClock(memory,d);
  assert.equal(runtime.frame,frame);assert.equal(view.getUint32(d+0x407a,true),clock+5);
  if(mode==='cancel')controller.abort();release();
  if(mode==='failure')await assert.rejects(pending,/Demo BIOS delivery failed/);else assert.equal(await pending,mode==='complete');
  if(mode!=='complete')assert.equal(runtime.frame,frame);
  assert.equal(memory[d+0x408e],0);assertAllocatedRaceAudioIdle(runtime.session);
 }
 assert.equal(held,true,'Sample-bearing replay must reach explicit legacy BIOS wait');
 console.log(`${physicsEngine}/${mode}: full legacy Tandy demo holds replay frames and releases continuation ownership; externally supplied timing only`);
}
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),bytes);
for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const cancel of [false,true]){
 const runtime=await createNativeDemoRuntime({...sampledTandyBrowserFixture(),physicsEngine,experimental10Hz:true,demoReplay:versionedDemoResource(physicsEngine),soundDevice:{kind:'tandy',driverGeneration:'ms-1990',port61:()=>0,interruptCx:()=>0,bios:serviceSuppliedTandySilentRequests}},
  {configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'BIOSRETURN',camera:0,graphics:2,soundEnabled:true});
 const live=()=>runtime.session.state.memory;runtime.audio.crash(new DataView(live().buffer).getUint16(d+0x8016,true));
 const requests:Array<{ax:number;es:number;bx:number;cx:number;dx:number;position:number}>=[];
 const pump=createLegacyTandyContinuationPump({write(){},bios(request,position){requests.push({...request,position});return requests.length!==1;}});
 for(let tick=0;tick<20&&!pump.waiting;tick++)pump.start(runtime.tickProgram(true),10+tick);
 assert.equal(pump.waitingForBiosReturn,true);assert.equal(requests.length,1);assert.equal(requests[0].cx,1);assert.equal(requests[0].bx,0x50f);
 const memory=live(),frame=runtime.frame,driver=()=>live().subarray(0x39e10,0x39e10+2993);
 assert.equal(memory[d+0x408e],1);assert.equal(new DataView(memory.buffer).getUint16(d+0x4e6a,true),1);assert.equal(driver()[0x504],1);assert.equal(driver()[0x505],1);
 // Explicit hardware completion while CPU remains inside BIOS, before its
 // return. No duration or automatic DMA progress is assumed by the pump.
 const completion=completeOriginalTandySample(driver(),0x91fb);assert.deepEqual(completion,{bios:[],chain:false});assert.equal(driver()[0x504],0);
 advanceOriginalNestedHardwareClock(memory,d);assert.equal(runtime.frame,frame);assert.equal(pump.waiting,true);assert.equal(requests.length,1);
 if(cancel){pump.cancel();assert.equal(runtime.frame,frame);assert.equal(requests.length,1);}
 else{
  assert.equal(pump.biosReturned(40),true);assert.equal(requests.length,2);assert.equal(requests[1].position,40);assert.equal(requests[1].es,0x1000);assert.equal(requests[1].bx,0x132);assert.equal(requests[1].cx,6);
  assert.equal(driver()[0x504],0,'Second request must not reactivate flag cleared by completion');
 }
 assert.equal(memory[d+0x408e],0);assert.equal(new DataView(memory.buffer).getUint16(d+0x4e6a,true),0);assertAllocatedRaceAudioIdle(runtime.session);pump.close();
 console.log(`${physicsEngine}/${cancel?'cancel':'return'}: actual replay BIOS pump preserves inter-call completion state and guard ownership`);
}
