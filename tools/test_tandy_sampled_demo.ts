import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sampledTandyBrowserFixture} from './sampled_tandy_browser_fixture.ts';
import {createNativeDemoRuntime} from '../lib/game/native-demo-runtime.ts';
import {createMs91TandyRaceBinding} from '../lib/game/ms91-tandy-race-binding.ts';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
import {advanceOriginalNestedHardwareClock} from '../lib/game/hardware-clock-memory.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL');
async function run(physicsEngine:'ms-1990'|'ms-1991',differential:boolean,blocks:number[]){
 let binding:ReturnType<typeof createMs91TandyRaceBinding>|undefined;
 const data={...sampledTandyBrowserFixture(differential),physicsEngine,experimental10Hz:true,demoReplay:versionedDemoResource(physicsEngine),soundDevice:{kind:'tandy' as const,driverGeneration:'ms-1991' as const,port61:()=>binding?.port61??0,interruptCx:()=>0,bios(){assert.fail('Modern demo cannot issue BIOS sample work');},sampleStarts(){assert.fail('Demo must use continuation delivery');}}};
 const runtime=await createNativeDemoRuntime(data,{configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'SAMPLEDEMO',camera:0,graphics:2,soundEnabled:true});
 const live=()=>runtime.session.state.memory,d=0x2d1a0;
 const beforeInvalid=live().slice();
 assert.throws(()=>runtime.tickProgram(true).next(),/requires the legacy Tandy device/);
 assert.deepEqual(live(),beforeInvalid,'Wrong-driver continuation rejects before hardware or race mutation');
 runtime.audio.crash(new DataView(live().buffer).getUint16(d+0x8016,true));
 let elapsed=0;const bus:number[][]=[];
 binding=createMs91TandyRaceBinding(0x39e1,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,
  initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,
  tone:{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1},sampleGain:0.5,busWrite(port,value,position){bus.push([port,value,elapsed+position]);}});
 binding.attach(live,()=>{assert.fail('Cannot double-tick demo');},()=>runtime.tickProgram(),()=>{advanceOriginalNestedHardwareClock(live(),d);});
 binding.write(runtime.initialWrites);
 const pcm=new Float32Array(blocks.reduce((a,b)=>a+b,0));
 for(const frames of blocks){pcm.set(binding.render(frames),elapsed);elapsed+=frames;}
 assert.ok(bus.some(([port])=>port===0xc5),'Custom demo sample actually reaches DAC');assert.ok(runtime.frame>0);
 assert.ok(pcm.every(Number.isFinite));assert.equal(runtime.session.physicsEngine,physicsEngine);
 binding.close();assert.equal(live()[d+0x408e],0);assert.equal(new DataView(live().buffer).getUint16(d+0x4e6a,true),0);
 return {pcm,bus,memory:live().slice(),frame:runtime.frame};
}
for(const engine of ['ms-1990','ms-1991'] as const)for(const differential of [false,true])assert.deepEqual(await run(engine,differential,[5120]),await run(engine,differential,[1,17,100,333,4669]));
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),bytes,'Existing replay bytes must remain unchanged');
console.log('Custom raw/differential sounds through complete demo runtime/binding match split PCM, bus timing, live memory and replay frame progression in both editions; close releases guards');
