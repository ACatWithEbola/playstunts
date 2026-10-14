import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runBrowserNativeManualRace} from '../lib/game/browser-native-manual-race.ts';
import {fixtureData} from './global-score-fixture.ts';
import createMunt from '../public/game/mt32-local/munt.mjs';
import {createMt32WasmOutput,type Mt32Wasm} from '../lib/game/mt32-wasm-output.ts';
import type {OriginalMt32MpuProgram} from '../lib/game/mt32-transport.ts';
import type {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {loadAllocatedReplay} from '../lib/game/allocated-replay-load.ts';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
import {hasReplayCheckpointCapacity} from '../lib/game/replay-checkpoint-capacity.ts';
import {readOriginalRaceResultMemory} from '../lib/game/race-result-memory.ts';
import {createBrowserFinishCourse} from './create_browser_finish_course.ts';
import {verifyGlobalScore} from '../lib/server/verify-global-score.ts';
import {GLOBAL_SCORE_RULES,validateScoreSubmission} from '../lib/game/global-score-format.ts';
import {encodeVersionedReplay,decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {captureGlobalRace} from '../lib/game/global-race-recording.ts';
import {completedScoreProof,namedCompletedScore} from '../lib/game/completed-score-offer.ts';
import type {GlobalScoreContext} from '../lib/game/global-score-file-store.ts';
import {serviceSuppliedTandySilentRequests} from '../lib/game/supplied-tandy-bios.ts';
import {createSwitchableMt32Output} from '../lib/game/switchable-mt32-output.ts';
import {pollAudioDuringFrameWait} from '../lib/game/frame-wait-audio-poll.ts';
const delayedFrame=process.argv.includes('--delayed-frame');
const tandyNatural=process.argv.includes('--tandy');
const powerCycle=process.argv.includes('--power-cycle');
const presentationCloseFailure=process.argv.includes('--presentation-close-failure');
if(presentationCloseFailure&&(process.argv.includes('--natural')||powerCycle))throw Error('Presentation failure requires the short exit fixture');
if(powerCycle&&(!process.argv.includes('--natural')||tandyNatural))throw Error('Power cycle requires a natural Roland race');
if(tandyNatural&&!process.argv.includes('--natural'))throw Error('Tandy option is reserved for natural-finish coverage');
function virtual(program:OriginalMt32MpuProgram){const writes:number[][]=[];let step=program.next();while(!step.done){if(step.value.kind==='write')writes.push([step.value.port,step.value.value]);step=program.next(0);}return {result:step.value,writes};}
const bytes=readFileSync('public/game/replays/CTKFIN.RPL'),before=Buffer.from(bytes),prior=Object.getOwnPropertyDescriptor(globalThis,'window');
const verifiedFinishes=new Map<string,{id:string;ticks:number;replay:Uint8Array}>();
const privateFinishes=new Map<string,{ticks:number;replay:Uint8Array}>();
const recordings=new WeakMap<Awaited<ReturnType<typeof createNativeManualRaceRuntime>>,ReturnType<typeof captureGlobalRace>>();
try{for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const generation of ['ms-1990','ms-1991'] as const)for(const lifecycle of ['finish','abort','retry','replay-retry','load-cancel','load-success','load-slow','natural'] as const){
 if(presentationCloseFailure&&lifecycle!=='finish')continue;
 if(process.argv.includes('--natural')&&lifecycle!=='natural')continue;
 if(!process.argv.includes('--natural')&&lifecycle==='natural')continue;
 const driveSource=lifecycle==='natural'&&physicsEngine==='ms-1991'?versionedDemoResource('ms-1991')!.bytes:bytes;
 const slowDrive=lifecycle==='natural'&&physicsEngine==='ms-1991'&&process.argv.includes('--slow');
 const autopilot=lifecycle==='natural'&&physicsEngine==='ms-1991'&&!slowDrive;
 const configuration=Array.from(driveSource.subarray(0,24));
 if(autopilot){configuration.splice(0,4,...Array.from('PMIN',c=>c.charCodeAt(0)));configuration[5]=1;configuration[6]=0;}
 const track=autopilot?createBrowserFinishCourse().raw:Array.from(driveSource.subarray(24,0x722));
 Object.defineProperty(globalThis,'window',{configurable:true,value:{location:{hostname:'localhost',search:`?play-engine=${physicsEngine}`}}});
 const module=await createMunt({wasmBinary:readFileSync('public/game/mt32-local/munt.wasm'),print(){},printErr(){}});
 const device=createMt32WasmOutput(module as unknown as Mt32Wasm,readFileSync('public/game/mt32-local/ctrl_mt32_1_07.rom'),readFileSync('public/game/mt32-local/pcm_mt32.rom'));
 let powerLoads=0,powerCloses=0,silentFrames=0,powerOffChecks=0,powerOnChecks=0;
 const power=createSwitchableMt32Output(32000,async()=>{
  const next=powerLoads++===0?device:createMt32WasmOutput(module as unknown as Mt32Wasm,readFileSync('public/game/mt32-local/ctrl_mt32_1_07.rom'),readFileSync('public/game/mt32-local/pcm_mt32.rom'));
  return {...next,close(){powerCloses++;next.close();}};
 });
 if(powerCycle)await power.powerOn();
 const audioDevice=powerCycle?{...power.output,active:()=>power.device?.active()??false,render(frames:number){const samples=power.output.render(frames);if(!power.device){assert.ok(samples.every(sample=>sample===0));silentFrames+=frames;}return samples;}}:device;
 const controller=new AbortController();let active=false,closed=0,results=0,stopped=0,loads=0,interimPolls=0;
 const context={sampleRate:48000,currentTime:0,state:'running',destination:{},createGain(){return {gain:{value:1},connect(){},disconnect(){}};},createBuffer(_n:number,count:number){return {getChannelData:()=>new Float32Array(count),copyToChannel(pcm:Float32Array){assert.ok(pcm.every(Number.isFinite));}};},createBufferSource(){return {connect(){},disconnect(){},start(){},stop(){}};}};
 const menus={ms91GraphicsSettings:{graphics:2,slowVideoManagement:false,configuredFramesPerSecond:slowDrive?10:20},setInputActive(value:boolean){active=value;},resetRaceMouse(){},raceEntryKey:()=>0,showRaceWaiting(){},
  async replayMenu(_session:unknown,services:{loadReplay():Promise<void>}){await services.loadReplay();},
  async loadAllocatedRaceReplay(data:Parameters<typeof loadAllocatedReplay>[0],runtime:Parameters<typeof loadAllocatedReplay>[1],services:Pick<Parameters<typeof loadAllocatedReplay>[2],'showWaiting'|'progress'|'writeAudio'>){
   loads++;if(lifecycle==='load-cancel')return;
   if(lifecycle==='load-slow')assert.equal(hasReplayCheckpointCapacity(runtime.session.state.memory,0x2d1a0,10,'mcga','ms-1991'),false,'Slow fixture must exercise checkpoint growth');
   return loadAllocatedReplay(data,runtime,{...services,async selectReplay(memory){memory().set([...Buffer.from('CTKFIN'),0],0x2d1a0+0xea);return 1;},async readReplay(){return lifecycle==='load-slow'?versionedDemoResource('ms-1991')!.bytes:new Uint8Array(bytes);},replayPhysicsEngine:()=>lifecycle==='load-slow'?'ms-1991':'ms-1990',replayFramesPerSecond:()=>lifecycle==='load-slow'?10:20});
  },
  async allocatedRaceResults(_data:unknown,runtime:Awaited<ReturnType<typeof createNativeManualRaceRuntime>>){
   assert.equal(audioDevice.active(),false,'Race device must be released before results');
   if(lifecycle==='natural'){
    const panel=readOriginalRaceResultMemory(runtime.session.state.memory,0x2d1a0).panel;assert.ok(panel.playerTime>0,'Natural result must have a real finish time: '+JSON.stringify(panel));
    let saved:Uint8Array|undefined;await runtime.session.saveReplay(async bytes=>{saved=bytes.slice();return 0;});assert.ok(saved);
    const history=recordings.get(runtime);assert.ok(history);
    assert.ok(history.inputs.length>0,'Roland sound continuation must not leave submission controls empty');
    assert.deepEqual(history.inputs,Array.from(saved.subarray(0x722)),'Natural finish observer retains every exported control byte');
    const rate=runtime.session.framesPerSecond,decoded=decodeVersionedReplay(encodeVersionedReplay(saved,physicsEngine,rate),physicsEngine);
    assert.equal(decoded.framesPerSecond,rate);assert.deepEqual(decoded.bytes,saved);
    const record=Array(52).fill(0);record[0]=84;record[50]=panel.playerTime&255;record[51]=panel.playerTime>>>8;
    const submission={record,replay:Array.from(saved),continued:false,flags:1,rules:GLOBAL_SCORE_RULES,physicsEngine,framesPerSecond:rate};
    // Exercise the website's actual offer builder, not just a manually assembled payload.
    const offerContext={runtime,history,state:{panel,carName:'',opponentCode:'',opponentCarCode:''}} as unknown as GlobalScoreContext;
    const proof=await completedScoreProof(offerContext,0);
    if(rate===20){
     assert.ok(proof,'Natural public finish must produce a website submission offer');
     assert.deepEqual(proof.replay,Array.from(saved),'Offer builder must preserve the complete exported replay');
     const named=namedCompletedScore(proof,'TEST DRIVER');
     validateScoreSubmission(named);
     const verifiedOffer=await verifyGlobalScore(named,fixtureData);
     assert.equal(verifiedOffer.ticks,panel.playerTime);
     assert.equal(verifiedOffer.physicsEngine,physicsEngine);
    }else assert.equal(proof,undefined,'Private10Hz finish must not offer a public score submission');
    if(rate===20){const verified=await verifyGlobalScore(submission,fixtureData);assert.equal(verified.ticks,panel.playerTime);assert.equal(verified.physicsEngine,physicsEngine);const previous=verifiedFinishes.get(physicsEngine);if(previous){assert.equal(verified.id,previous.id,'Sound driver must not change score identity');assert.equal(verified.ticks,previous.ticks);assert.deepEqual(verified.replay,previous.replay);}else verifiedFinishes.set(physicsEngine,{id:verified.id,ticks:verified.ticks,replay:verified.replay.slice()});console.log(`${generation}/${physicsEngine}: natural finish ${panel.playerTime}ticks independently verified from exported replay`);}
    else{
     assert.equal(physicsEngine,'ms-1991');assert.equal(rate,10);
     assert.throws(()=>validateScoreSubmission(submission),/Only 20 Hz/);
     const previous=privateFinishes.get(physicsEngine);
     if(previous){assert.equal(panel.playerTime,previous.ticks,'Sound-driver edition cannot alter private slow-mode finish time');assert.deepEqual(saved,previous.replay,'Sound-driver edition cannot alter private slow-mode recorded inputs');}
     else privateFinishes.set(physicsEngine,{ticks:panel.playerTime,replay:saved.slice()});
     console.log(`${generation}/${physicsEngine}: natural private10Hz finish ${panel.playerTime}ticks; exported inputs/cadence round-trip unchanged; public submission rejected`);
    }
   }
   results++;return results===1?(lifecycle==='retry'?1:lifecycle==='replay-retry'?0:2):2;
  },
  async allocatedRacePresentation(runtime:Awaited<ReturnType<typeof createNativeManualRaceRuntime>>,pump:()=>Promise<void>){
   assert.equal(runtime.session.physicsEngine,loads&&lifecycle==='load-success'?'ms-1990':loads&&lifecycle==='load-slow'?'ms-1991':physicsEngine);runtime.session.skipIntroduction();if(lifecycle!=='natural')runtime.session.finishIteration=async()=> 'exit';
   if(!recordings.has(runtime))recordings.set(runtime,captureGlobalRace(runtime));
   if(lifecycle==='replay-retry'&&results===1)assert.equal(runtime.session.framesPerSecond,20,'Results replay retains original race cadence');
   if(loads&&lifecycle==='load-success'){assert.equal(runtime.session.framesPerSecond,20);assert.ok(runtime.session.length>0,'Loaded replay retains recorded input bank');}
   if(loads&&lifecycle==='load-slow'){assert.equal(runtime.session.framesPerSecond,10);assert.equal(runtime.session.length,958);}
   if(loads&&lifecycle==='load-slow')assert.equal(hasReplayCheckpointCapacity(runtime.session.state.memory,0x2d1a0,10,'mcga','ms-1991'),true);
   if(lifecycle.startsWith('load-')&&!loads){runtime.replayControls=async host=>host.menu();runtime.session.finishIteration=async host=>{await host.replayControls();return 'exit';};}
   if(lifecycle!=='natural')new DataView(runtime.session.state.memory.buffer).setUint16(0x2d1a0+0x8018,1,true);
   let polls=0,waypoint=0,held=0,lastControl=-1;
   const waypoints=[[690432,950272],[950272,950272],[950272,690432],[690432,690432],[700000,850000]];
   const controls=()=>{
    const live=runtime.session.state.memory,frame=new DataView(live.buffer,live.byteOffset,live.byteLength).getUint16(0x2d1a0+0x8fd8,true);
    if(autopilot){if(frame%5===0&&frame!==lastControl){lastControl=frame;const car=runtime.session.state.player.driving.car;let target=waypoints[waypoint];if(Math.hypot(target[0]-car.pose.position[0],target[1]-car.pose.position[2])<12000&&waypoint<waypoints.length-1)target=waypoints[++waypoint];const desired=Math.atan2(-(target[0]-car.pose.position[0]),target[1]-car.pose.position[2])*1024/(2*Math.PI),error=((desired-car.pose.rotation[0]+1536)%1024)-512,wheel=Math.max(-150,Math.min(150,-error*1.5));held=(car.engine.speed<7200?1:car.engine.speed>8000?2:0)|(wheel>car.grip.steeringAngle+10?4:wheel<car.grip.steeringAngle-10?8:0);}return held;}
    return lifecycle==='natural'?(driveSource[0x722+frame]??1):1;
   };
   return {devices:{mouse:()=>({x:160,y:100,buttons:0}),joystickSteering:()=>0,controls,keyDown:()=>0},key:()=>0,mouseButtons:()=>0,joystickButtons:()=>0,selectMouse:async()=>{},control(){},presentWorld(){},present(){},waiting(){},resetMouse(){},async releaseInput(){},opponent:{async show(){},drawTime(){},async key(){return 27;}},async nextFrame(){assert.ok(++polls<4000,'Race must not stall indefinitely');if(powerCycle&&polls===20){power.powerOff();powerOffChecks++;}if(powerCycle&&polls===100){assert.equal(await power.powerOn(),true);powerOnChecks++;}if(delayedFrame)await pollAudioDuringFrameWait(new Promise<void>(resolve=>setTimeout(resolve,3)),async()=>{interimPolls++;context.currentTime+=.025;await pump();},()=>true,1);context.currentTime+=.05;await pump();if(lifecycle==='abort')controller.abort();},close(){closed++;}};
  }};
 if(presentationCloseFailure){
  const prepare=menus.allocatedRacePresentation;
  menus.allocatedRacePresentation=async(...args)=>{
   const view=await prepare(...args);
   return {...view,close(){view.close();throw Error('Presentation close failed');}};
  };
 }
 try{
  const running=runBrowserNativeManualRace({context,data:{...fixtureData,physicsEngine,experimental10Hz:true,soundDevice:tandyNatural?{kind:'tandy',driverGeneration:generation,port61:()=>0,interruptCx:()=>0,bios:serviceSuppliedTandySilentRequests}:{kind:'mt32',driverGeneration:generation,execute:virtual}},menus,menu:{configuration,track,name:'TIMED',camera:0,graphics:2,soundEnabled:true},signal:controller.signal,stopMusic:async()=>{stopped++;},...(!tandyNatural?{timedMt32:{device:audioDevice,generation,patch:readFileSync('public/game/original-resources/MT32.PLB'),profile:{cpuHz:4772728,pollCycles:20,resetClocks:16705,initialPort61:0,interrupts(){},cancelled:()=>false,yieldTask:async()=>{}},async stopMusic(){stopped++;}}}:{})} as never);
  if(presentationCloseFailure)await assert.rejects(running,/Presentation close failed/);
  else if(lifecycle==='abort')await assert.rejects(running,{name:'AbortError'});
  else{const restored=await running;assert.deepEqual(restored.configuration,configuration);assert.deepEqual(restored.track,track);}
  assert.equal(active,false);assert.equal(closed,lifecycle==='retry'||lifecycle==='replay-retry'||lifecycle==='load-success'||lifecycle==='load-slow'?2:1);assert.ok(stopped>=(tandyNatural?1:2));assert.equal(audioDevice.active(),false);assert.ok(audioDevice.render(512).every(value=>value===0));
  if(powerCycle){assert.equal(powerOffChecks,1);assert.equal(powerOnChecks,1);assert.equal(powerLoads,2);assert.equal(powerCloses,1);assert.ok(silentFrames>0);console.log(`${generation}/${physicsEngine}: panel Off→On during natural race; ${silentFrames} silent synthesis frames, no device-owner loss`);}
  if(lifecycle.startsWith('load-'))assert.equal(loads,1);
  if(delayedFrame){assert.ok(interimPolls>0,'Delayed-frame fixture must actually exercise intervening audio delivery');console.log(`${generation}/${physicsEngine}: ${interimPolls} serialized frame-wait polls exercised`);}
  console.log(`${generation}/${physicsEngine}/${lifecycle}: production manual runner completes with ${tandyNatural?'Tandy audio':'real Roland device'} and released input; mocked presentation/${lifecycle==='natural'?'natural completion':'forced exit'}`);
 }finally{if(powerCycle){power.close();assert.equal(powerCloses,2);}else device.close();}
}}finally{if(prior)Object.defineProperty(globalThis,'window',prior);else Reflect.deleteProperty(globalThis,'window');}
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),before);
