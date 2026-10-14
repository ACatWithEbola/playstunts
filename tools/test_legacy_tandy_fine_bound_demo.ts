import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sampledTandyBrowserFixture} from './sampled_tandy_browser_fixture.ts';
import {createNativeDemoRuntime} from '../lib/game/native-demo-runtime.ts';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
import {createLegacyTandyContinuationPump} from '../lib/game/legacy-tandy-continuation-pump.ts';
import {createLegacyTandyChipDevice} from '../lib/game/legacy-tandy-chip-device.ts';
import {createTandyChipPcmProjection} from '../lib/game/tandy-chip-pcm-projection.ts';
import {completeOriginalTandySample} from '../lib/game/tandy-sample.ts';
import {serviceSuppliedTandySilentRequests} from '../lib/game/supplied-tandy-bios.ts';
import {setOriginalTandyVolume} from '../lib/game/tandy-control.ts';
import {originalTandyDacGain} from '../lib/game/tandy-dac-transfer.ts';
import {assertAllocatedRaceAudioIdle} from '../lib/game/advance-allocated-race.ts';
import {createLegacyTandyFineRaceBinding} from '../lib/game/legacy-tandy-fine-race-binding.ts';
import {createTandyChipToneProjection} from '../lib/game/tandy-chip-tone-projection.ts';
const replay=readFileSync('public/game/replays/CTKFIN.RPL'),d=0x2d1a0;
async function run(engine:'ms-1990'|'ms-1991',rate:number,split:boolean,mode:'complete'|'cancel'|'error'='complete',unified=false,mixed=false,preReturn=false){
 assert.ok(!preReturn||(unified&&mode==='complete'),'Pre-return fixture requires unified complete path');
 const toneProfile={variant:'pssj3' as const,clockHz:3579545,psgGain:0.5,speakerGain:1},tone=mixed?createTandyChipToneProjection(rate,toneProfile):undefined;let port61=0;
 const fixture=sampledTandyBrowserFixture(false,256,true);fixture.base.set(Uint8Array.from({length:256},(_,index)=>index),0x10132);
 const runtime=await createNativeDemoRuntime({...fixture,physicsEngine:engine,experimental10Hz:true,demoReplay:versionedDemoResource(engine),soundDevice:{kind:'tandy',driverGeneration:'ms-1990',port61:()=>mixed?port61:0,interruptCx:()=>0,bios:serviceSuppliedTandySilentRequests}},
 {configuration:[...replay.subarray(0,24)],track:[...replay.subarray(24,0x722)],name:'FINEBIOS',camera:0,graphics:2,soundEnabled:true});
 const live=()=>runtime.session.state.memory;
 runtime.audio.crash(new DataView(live().buffer).getUint16(d+0x8016,true));
 let calls=0,value=128,volume=0;const reads:number[]=[],events:number[][]=[];
 const projection=createTandyChipPcmProjection(rate,3579545,0);
 const level=(tick:number)=>projection.record(tick,(value-128)/128*originalTandyDacGain(volume));
 const device=createLegacyTandyChipDevice(address=>{reads.push(address);if(mode==='error')throw Error('Injected live DMA read fault');return live()[address];},{divisor:123,volume:0,grant:()=>true,byte(tick,byte,gain){value=byte;volume=gain;events.push([tick,byte,gain]);level(tick);},completion(ax,tick){events.push([tick,ax]);const result=completeOriginalTandySample(live().subarray(0x39e10,0x39e10+2993),ax);assert.equal(result.chain,false);for(const request of result.bios){assert.equal(device.play(request).carry,false);volume=request.ax&255;level(tick);}}});
 const manualWrites=(writes:number[][])=>{for(const [port,byte] of writes){events.push([device.snapshot().clock.tick,port,byte]);if(port===0xc6||port===0xc7){device.write(port,byte);if(port===0xc7){volume=byte>>>5;level(device.snapshot().clock.tick);}}else{if(port===0x61)port61=byte;tone?.write(device.snapshot().clock.tick,port,byte);}}};
 const pump=createLegacyTandyContinuationPump({write:manualWrites,bios(request){events.push([device.snapshot().clock.tick,request.ax,request.es,request.bx,request.cx,request.dx]);assert.equal(device.play(request).carry,false);volume=request.ax&255;level(device.snapshot().clock.tick);return ++calls!==1;}});
 const binding=unified?createLegacyTandyFineRaceBinding(address=>{reads.push(address);if(mode==='error')throw Error('Injected live DMA read fault');return live()[address];},{sampleRate:rate,clockHz:3579545,divisor:123,volume:0,initialByte:128,decodeByte:byte=>(byte-128)/128,sampleGain:1,grant:()=>true,
  tone:mixed?toneProfile:undefined,byte(tick,byte,gain){events.push([tick,byte,gain]);},busWrite(port,byte,tick){events.push([tick,port,byte]);if(port===0x61)port61=byte;},toneWrites(writes){assert.ok(writes.every(([port])=>port!==0xc6&&port!==0xc7));},
  bios(request,tick,bus){events.push([tick,request.ax,request.es,request.bx,request.cx,request.dx]);assert.equal(bus.play(request).carry,false);calls++;if(preReturn&&calls===1){bus.advance(1);assert.equal(bus.serviceInterrupt(false),false);assert.equal(bus.serviceInterrupt(true),true);return true;}return calls!==1;},
  completion(ax,tick,bus){events.push([tick,ax]);const result=completeOriginalTandySample(live().subarray(0x39e10,0x39e10+2993),ax);assert.equal(result.chain,false);for(const request of result.bios)assert.equal(bus.play(request).carry,false);},
 }):{
  get waiting(){return pump.waiting;},get waitingForBiosReturn(){return pump.waitingForBiosReturn;},
  start(program:Parameters<typeof pump.start>[0]){return pump.start(program,device.snapshot().clock.tick);},biosReturned(){return pump.biosReturned(device.snapshot().clock.tick);},
  advance:device.advance,serviceInterrupt:device.serviceInterrupt,status:device.status,
  write:manualWrites,
  render(frames:number){const pcm=projection.render(frames,device.snapshot().clock.tick),tones=tone?.render(frames,device.snapshot().clock.tick);if(tones)for(let i=0;i<frames;i++)pcm[i]+=tones[i];return pcm;},
  close(){pump.close();device.close();projection.close();tone?.close();},
 };
 if(mixed)binding.write(runtime.initialWrites.filter(([port])=>[0xc0,0xc1,0x40,0x42,0x43,0x61].includes(port)));
 for(let tick=0;tick<20&&!binding.waiting&&calls===0;tick++){setOriginalTandyVolume(live().subarray(0x39e10,0x39e10+2993),0,127);binding.start(runtime.tickProgram(true));}
 assert.equal(binding.waitingForBiosReturn,!preReturn);assert.equal(calls,preReturn?2:1);
 if(mode!=='complete'){
  const frame=runtime.frame;
  if(mode==='error')assert.throws(()=>binding.advance(1),/Injected live DMA read fault/);
  binding.close();assertAllocatedRaceAudioIdle(runtime.session);pump.close();device.close();projection.close();tone?.close();assert.equal(binding.waiting,false);assert.equal(runtime.frame,frame);assert.equal(calls,1);
  assert.equal(reads.length,mode==='error'?1:0);assertAllocatedRaceAudioIdle(runtime.session);
  assert.equal(live()[d+0x408e],0);assert.equal(new DataView(live().buffer).getUint16(d+0x4e6a,true),0);
  assert.throws(()=>binding.advance(1),/unavailable/);assert.throws(()=>binding.biosReturned(),/closed|unavailable/);assert.throws(()=>binding.render(1),/closed|unavailable/);
  assert.equal(reads.length,mode==='error'?1:0);
  return {events,reads,pcm:[] as number[],memory:live().slice(),frame};
 }
 // Explicit fixture BIOS return/window after one chip clock, not measured CPU
 // service latency. The one-byte DX1 transfer completes without audio rounding.
 if(!preReturn){binding.advance(1);assert.equal(binding.serviceInterrupt(false),false);binding.serviceInterrupt(true);binding.biosReturned();}
 assert.equal(calls,2);assert.equal(binding.waiting,false);
 setOriginalTandyVolume(live().subarray(0x39e10,0x39e10+2993),0,127);binding.start(runtime.tickProgram(true));
 if(split)for(const count of [1,17,982,5000,94000])binding.advance(count);else binding.advance(100000);
 while(binding.serviceInterrupt(true)){}
 assert.equal(binding.status().carry,false);assert.equal(binding.waiting,false);assertAllocatedRaceAudioIdle(runtime.session);
 assert.deepEqual(reads.filter(address=>address>=0x10132&&address<0x10232),Array.from({length:256},(_,index)=>0x10132+index));
 const pcm=split?[...binding.render(1),...binding.render(9),...binding.render(90)]:[...binding.render(100)];
 assert.ok(pcm.every(Number.isFinite));assert.ok(pcm.some(sample=>sample!==0));
 const result={events,reads,pcm,memory:live().slice(),frame:runtime.frame};binding.close();pump.close();device.close();projection.close();tone?.close();return result;
}
for(const engine of ['ms-1990','ms-1991'] as const)for(const rate of [44100,48000])for(const mixed of [false,true]){const baseline=await run(engine,rate,false,'complete',false,mixed);assert.deepEqual(baseline,await run(engine,rate,true,'complete',false,mixed));assert.deepEqual(baseline,await run(engine,rate,false,'complete',true,mixed));assert.deepEqual(baseline,await run(engine,rate,true,'complete',true,mixed));for(const mode of ['cancel','error'] as const)assert.deepEqual(await run(engine,rate,false,mode,false,mixed),await run(engine,rate,false,mode,true,mixed));console.log(`${engine}/${rate}/${mixed?'mixed':'sample'}: unified and separate fine-chip bindings match actual replay memory/events/PCM whole/split and cancellation/fault teardown; BIOS window explicit`);}
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),replay);
for(const engine of ['ms-1990','ms-1991'] as const)for(const rate of [44100,48000])for(const mixed of [false,true]){
 const baseline=await run(engine,rate,false,'complete',true,mixed);
 for(const split of [false,true])assert.deepEqual(baseline,await run(engine,rate,split,'complete',true,mixed,true));
 console.log(`${engine}/${rate}/${mixed?'mixed':'sample'}: actual race pre-return completion preserves full memory/events/PCM against explicit-return fixture; ordering only, one-chip duration supplied`);
}
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),replay);
