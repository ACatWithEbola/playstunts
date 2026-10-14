import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sampledTandyBrowserFixture} from './sampled_tandy_browser_fixture.ts';
import {createNativeDemoRuntime} from '../lib/game/native-demo-runtime.ts';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
import {createLegacyTandyRaceBinding} from '../lib/game/legacy-tandy-race-binding.ts';
import {createLegacyTandyDmaClockOwner} from '../lib/game/legacy-tandy-dma-clock-owner.ts';
import {completeOriginalTandySample} from '../lib/game/tandy-sample.ts';
import {serviceSuppliedTandySilentRequests} from '../lib/game/supplied-tandy-bios.ts';
import {assertAllocatedRaceAudioIdle} from '../lib/game/advance-allocated-race.ts';
import {setOriginalTandyVolume} from '../lib/game/tandy-control.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL'),d=0x2d1a0;
for(const audible of process.argv.includes('--audible')?[true]:[false,true])for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const sampleRate of [44100,48000]){
 const fixture=sampledTandyBrowserFixture(false,256,audible);fixture.base.set(Uint8Array.from({length:256},(_,index)=>index),0x10132);
 const runtime=await createNativeDemoRuntime({...fixture,physicsEngine,experimental10Hz:true,demoReplay:versionedDemoResource(physicsEngine),soundDevice:{kind:'tandy',driverGeneration:'ms-1990',port61:()=>0,interruptCx:()=>0,bios:serviceSuppliedTandySilentRequests}},
  {configuration:[...bytes.subarray(0,24)],track:[...bytes.subarray(24,0x722)],name:'CLOCKBIOS',camera:0,graphics:2,soundEnabled:true});
 const live=()=>runtime.session.state.memory;
 const initialMemory=live();
 if(audible)live()[d+0x9f5a]=127;
 runtime.audio.crash(new DataView(live().buffer).getUint16(d+0x8016,true));
 let bus:Parameters<Parameters<typeof createLegacyTandyRaceBinding>[1]['bios']>[2]|undefined;
 const reads:number[]=[],pcm:number[]=[],completions:number[]=[];let calls=0,updated=false;
 const clock=createLegacyTandyDmaClockOwner({sampleRate,clockHz:3579545,divisor:123,volume:0},()=>{assert.ok(bus);if(!bus.status().carry)return false;bus.grantDma();return true;});
 const binding=createLegacyTandyRaceBinding(address=>{reads.push(address);return live()[address];},{sampleRate,tone:{variant:'pssj3',clockHz:3579545,psgGain:0,speakerGain:0},sampleGain:1,initialByte:128,initialVolume:0,decodeByte:value=>(value-128)/128,deferCompletionInterrupts:true,
  program:()=>runtime.tickProgram(true),nestedInterrupt(){throw Error('Unexpected game tick during hardware service');},
  hardwareInterrupt(frame,current){bus=current;try{clock.service(frame);}finally{bus=undefined;}},
  bios(request,_frame,current){assert.equal(current.play(request).carry,false);clock.program(request.dx,request.ax&255);return ++calls!==1;},
  busWrite(port,value){if(port===0xc6||port===0xc7)clock.write(port,value);},
  completion(ax,frame,current){completions.push(frame);const result=completeOriginalTandySample(live().subarray(0x39e10,0x39e10+2993),ax);assert.equal(result.chain,false);for(const request of result.bios){assert.equal(current.play(request).carry,false);clock.program(request.dx,request.ax&255);}},
 });
 let cursor=0;
 for(;cursor<20&&!binding.waiting;cursor++){if(audible)setOriginalTandyVolume(live().subarray(0x39e10,0x39e10+2993),0,127);binding.scheduleGameInterrupt(cursor);binding.scheduleHardwareInterrupt(cursor+1);pcm.push(...binding.render(1));}
 assert.equal(calls,1);assert.equal(binding.waiting,true);
 for(let frame=cursor;frame<2000;frame++){
  // Explicit enabled CPU window, not measured BIOS service latency.
  if(binding.pendingCompletionInterrupts){binding.scheduleCompletionInterrupt(frame);if(calls===1)binding.scheduleBiosReturn(frame);}
  if(Number(calls)===2&&!updated){if(audible)setOriginalTandyVolume(live().subarray(0x39e10,0x39e10+2993),0,127);binding.scheduleGameInterrupt(frame);updated=true;}
  binding.scheduleHardwareInterrupt(frame+1);pcm.push(...binding.render(1));
 }
 assert.equal(calls,2);assert.equal(binding.waiting,false);assert.equal(binding.pendingCompletionInterrupts,0);
 assert.equal(completions.length,2);assert.deepEqual(reads.filter(address=>address>=0x10132&&address<0x10232),Array.from({length:256},(_,index)=>0x10132+index));
 assert.ok(pcm.every(Number.isFinite));assert.equal(pcm.some(value=>value!==0),audible,'Sound output follows original driver volume');
 clock.close();binding.close();assertAllocatedRaceAudioIdle(runtime.session);
 assert.equal(live()[d+0x408e],0);assert.equal(new DataView(live().buffer).getUint16(d+0x4e6a,true),0);
 assert.notEqual(live(),initialMemory,'DMA and volume controls must follow replaced game memory');
 console.log(`${physicsEngine}/${sampleRate}/${audible?'audible':'muted'}: chip-clock grants complete actual allocated sample and release BIOS/game ownership across memory replacement; CPU windows explicitly supplied`);
}
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),bytes);
