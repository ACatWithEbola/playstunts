import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sampledTandyBrowserFixture} from './sampled_tandy_browser_fixture.ts';
import {createNativeDemoRuntime} from '../lib/game/native-demo-runtime.ts';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
import {createLegacyTandyVirtualRaceBinding} from '../lib/game/legacy-tandy-virtual-race-binding.ts';
import {serviceSuppliedTandySilentRequests} from '../lib/game/supplied-tandy-bios.ts';
import {completeOriginalTandySample} from '../lib/game/tandy-sample.ts';
import {setOriginalTandyVolume} from '../lib/game/tandy-control.ts';
import {assertAllocatedRaceAudioIdle} from '../lib/game/advance-allocated-race.ts';
const replay=readFileSync('public/game/replays/CTKFIN.RPL');
async function run(engine:'ms-1990'|'ms-1991',rate:number,split:boolean,mixed:boolean,mode:'complete'|'cancel'|'error'='complete'){
 const fixture=sampledTandyBrowserFixture(false,256,true);fixture.base.set(Uint8Array.from({length:256},(_,i)=>i),0x10132);
 let port61=0;
 const runtime=await createNativeDemoRuntime({...fixture,physicsEngine:engine,experimental10Hz:true,demoReplay:versionedDemoResource(engine),soundDevice:{kind:'tandy',driverGeneration:'ms-1990',port61:()=>port61,interruptCx:()=>0,bios:serviceSuppliedTandySilentRequests}},
 {configuration:[...replay.subarray(0,24)],track:[...replay.subarray(24,0x722)],name:'VIRTUAL',camera:0,graphics:2,soundEnabled:true});
 const live=()=>runtime.session.state.memory,driver=()=>live().subarray(0x39e10,0x39e10+2993);
 runtime.audio.crash(new DataView(live().buffer).getUint16(0x2d1a0+0x8016,true));
 const reads:number[]=[],events:number[][]=[];
 const binding=createLegacyTandyVirtualRaceBinding(address=>{reads.push(address);if(mode==='error')throw Error('Injected virtual DMA fault');return live()[address];},{sampleRate:rate,clockHz:3579545,divisor:123,volume:0,initialByte:128,decodeByte:b=>(b-128)/128,sampleGain:1,
  tone:mixed?{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1}:undefined,
  toneWrites(){},busWrite(port,value,tick){events.push([tick,port,value]);if(port===0x61)port61=value;},byte(tick,value,gain){events.push([tick,value,gain]);},
  completion(ax,tick,bus){events.push([tick,ax]);const result=completeOriginalTandySample(driver(),ax);assert.equal(result.chain,false);for(const request of result.bios)assert.equal(bus.play(request).carry,false);}});
 if(mixed)binding.write(runtime.initialWrites.filter(([port])=>[0xc0,0xc1,0x40,0x42,0x43,0x61].includes(port)));
 let failed=false;
 for(let i=0;i<20&&reads.length===0;i++){
  setOriginalTandyVolume(driver(),0,127);
  if(mode==='error'){try{binding.start(runtime.tickProgram(true));}catch(error){assert.match(String(error),/Injected virtual DMA fault/);failed=true;}}
  else binding.start(runtime.tickProgram(true));
 }
 assert.equal(binding.waiting,false);assert.ok(reads.length>0);assertAllocatedRaceAudioIdle(runtime.session);
 if(mode!=='complete'){
  assert.equal(failed,mode==='error');const count=reads.length,frame=runtime.frame;binding.close();assertAllocatedRaceAudioIdle(runtime.session);
  assert.throws(()=>binding.render(1),/unavailable/);assert.equal(reads.length,count);assert.equal(runtime.frame,frame);return;
 }
 const pcm=split?[...binding.render(1),...binding.render(99),...binding.render(900)]:[...binding.render(1000)];
 assert.equal(binding.status().carry,false);assert.ok(pcm.some(value=>value!==0));assert.ok(pcm.every(Number.isFinite));
 assert.deepEqual(reads.filter(address=>address>=0x10132&&address<0x10232),Array.from({length:256},(_,i)=>0x10132+i));
 const result={memory:live().slice(),reads,events,pcm,frame:runtime.frame,snapshot:binding.snapshot()};binding.close();assertAllocatedRaceAudioIdle(runtime.session);return result;
}
for(const engine of ['ms-1990','ms-1991'] as const)for(const rate of [44100,48000])for(const mixed of [false,true]){
 assert.deepEqual(await run(engine,rate,false,mixed),await run(engine,rate,true,mixed));
 for(const mode of ['cancel','error'] as const)await run(engine,rate,false,mixed,mode);
 console.log(`${engine}/${rate}/${mixed?'mixed':'sample'}: virtual adapter actual allocated replay matches whole/split memory/events/PCM and cancellation/read-fault release`);
}
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),replay);
