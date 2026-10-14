import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sampledTandyBrowserFixture} from './sampled_tandy_browser_fixture.ts';
import {createNativeDemoRuntime} from '../lib/game/native-demo-runtime.ts';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
import {createLegacyTandyRaceBinding} from '../lib/game/legacy-tandy-race-binding.ts';
import {completeOriginalTandySample} from '../lib/game/tandy-sample.ts';
import {serviceSuppliedTandySilentRequests} from '../lib/game/supplied-tandy-bios.ts';
import {advanceOriginalNestedHardwareClock} from '../lib/game/hardware-clock-memory.ts';
import {assertAllocatedRaceAudioIdle} from '../lib/game/advance-allocated-race.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL'),d=0x2d1a0;
async function run(physicsEngine:'ms-1990'|'ms-1991',blocks:number[],cancel=false,deferCompletionInterrupts=false,owned=false){
 const runtime=await createNativeDemoRuntime({...sampledTandyBrowserFixture(),physicsEngine,experimental10Hz:true,demoReplay:versionedDemoResource(physicsEngine),soundDevice:{kind:'tandy',driverGeneration:'ms-1990',port61:()=>0,interruptCx:()=>0,bios:serviceSuppliedTandySilentRequests}},
  {configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'BOUNDBIOS',camera:0,graphics:2,soundEnabled:true});
 const live=()=>runtime.session.state.memory;runtime.audio.crash(new DataView(live().buffer).getUint16(d+0x8016,true));
 const events:number[][]=[],reads:number[]=[],pcm:number[]=[];let requests=0,cursor=0;
 const binding=createLegacyTandyRaceBinding(address=>{reads.push(address);return live()[address];},{deferCompletionInterrupts,sampleRate:48000,tone:{variant:'pssj3',clockHz:3579545,psgGain:0,speakerGain:0},sampleGain:1,initialByte:128,initialVolume:0,decodeByte:value=>(value-128)/128,
  program:()=>runtime.tickProgram(true),nestedInterrupt(frame){events.push([frame,1]);advanceOriginalNestedHardwareClock(live(),d);},
  hardwareInterrupt(_frame,bus){bus.grantDma();},
  bios(request,frame,bus){events.push([frame,2,request.ax,request.es,request.bx,request.cx,request.dx]);assert.equal(bus.play(request).carry,false);return ++requests!==1;},
  completion(ax,frame,bus){events.push([frame,3,ax]);const result=completeOriginalTandySample(live().subarray(0x39e10,0x39e10+2993),ax);assert.equal(result.chain,false);for(const request of result.bios)bus.play(request);},
 });
 for(let tick=0;tick<20&&!binding.waiting;tick++){binding.scheduleGameInterrupt(cursor);pcm.push(...binding.render(1));cursor++;}
 assert.equal(binding.waiting,true);assert.equal(requests,1);const frame=runtime.frame;
 if(cancel){binding.close();assert.equal(runtime.frame,frame);assert.equal(requests,1);}
 else{
  // Explicit fixture event order; these sample positions are not BIOS latency.
  const grant=(frame:number)=>owned?binding.scheduleHardwareInterrupt(frame):binding.scheduleDma(frame);
  grant(cursor);binding.scheduleGameInterrupt(cursor+1);binding.scheduleBiosReturn(cursor+2);
  for(let byte=0;byte<6;byte++)grant(cursor+3+byte);
  if(deferCompletionInterrupts)binding.scheduleCompletionInterrupt(cursor+10);
  for(const frames of blocks)pcm.push(...binding.render(frames));
  assert.equal(requests,2);assert.equal(binding.waiting,false);assert.equal(live()[0x39e10+0x504],0);
  assert.deepEqual(reads.filter(address=>address>=0x10132&&address<0x10138),[0x10132,0x10133,0x10134,0x10135,0x10136,0x10137]);
  assert.ok(pcm.every(Number.isFinite));binding.close();
 }
 assert.equal(live()[d+0x408e],0);assert.equal(new DataView(live().buffer).getUint16(d+0x4e6a,true),0);assertAllocatedRaceAudioIdle(runtime.session);
 return {pcm,events,reads,memory:live().slice(),frame:runtime.frame};
}
for(const engine of ['ms-1990','ms-1991'] as const){assert.deepEqual(await run(engine,[10]),await run(engine,[1,2,7]));await run(engine,[],true);const baseline=await run(engine,[12],false,true);assert.deepEqual(baseline,await run(engine,[1,2,6,1,2],false,true));assert.deepEqual(baseline,await run(engine,[12],false,true,true));assert.deepEqual(baseline,await run(engine,[1,2,6,1,2],false,true,true));await run(engine,[],true,true);}
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),bytes);
console.log('Both-edition allocated legacy replay/mixer/BIOS binding preserves split PCM, requests, completions, full memory and frame progression; pending close releases guards; explicit timing only');
