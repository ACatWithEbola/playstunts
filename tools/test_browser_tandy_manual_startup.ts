import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {runBrowserNativeManualRace} from '../lib/game/browser-native-manual-race.ts';
import {createMs91TandyRaceBinding} from '../lib/game/ms91-tandy-race-binding.ts';
import {sampledTandyBrowserFixture} from './sampled_tandy_browser_fixture.ts';
import {loadAllocatedReplay} from '../lib/game/allocated-replay-load.ts';
import {ms91TandySampleStatus as modernStatus} from '../lib/game/ms91-tandy-sample-status.ts';
import {createBrowserLegacyTandyVirtualBackend} from '../lib/game/browser-legacy-tandy-virtual-backend.ts';
import {serviceSuppliedTandySilentRequests} from '../lib/game/supplied-tandy-bios.ts';
import {captureGlobalRace} from '../lib/game/global-race-recording.ts';
const legacyVirtual=process.argv.includes('--legacy-virtual');
let checkedLegacy:ReturnType<typeof createBrowserLegacyTandyVirtualBackend>|undefined;
const ms91TandySampleStatus=(driver:Uint8Array,channel:number)=>legacyVirtual?(checkedLegacy!.status().carry?0:1):modernStatus(driver,channel);
const bytes=readFileSync('public/game/replays/CTKFIN.RPL'),original=bytes.slice();
const previousWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
const references=new Map<string,{buffers:Float32Array[];memory:Uint8Array}>();
try{for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const replayPlayback of [false,true])for(const sampleMode of ['none','raw','differential'] as const)for(const lifecycle of ['abort','finish','load-cancel','load-success'] as const)for(const launchMode of ['explicit','preview','production'] as const){
if(legacyVirtual&&(sampleMode==='differential'||launchMode==='preview'||(lifecycle.startsWith('load-')&&launchMode!=='explicit')))continue;
if(lifecycle.startsWith('load-')&&(sampleMode==='none'||replayPlayback))continue;
if(replayPlayback&&physicsEngine!=='ms-1990')continue;
if(sampleMode!=='none'&&replayPlayback)continue;
Object.defineProperty(globalThis,'window',{configurable:true,value:{location:{hostname:'localhost',search:`?play-engine=${replayPlayback?'ms-1991':physicsEngine}${launchMode==='preview'?'&preview-tandy=full':''}`}}});
const controller=new AbortController();
const sources:any[]=[],buffers:Float32Array[]=[];let closedPresentation=0,active=false;
let capturedMemory:Uint8Array|undefined,liveMemory:Uint8Array|undefined,presentationFrames=0,dacWrites=0,loads=0;
const context={sampleRate:48000,currentTime:0,state:'running',destination:{},createGain:()=>({gain:{value:0},connect(){},disconnect(){}}),
 createBuffer:()=>({copyToChannel(pcm:Float32Array){buffers.push(pcm.slice());}}),createBufferSource(){const source={buffer:null as unknown,onended:null as unknown,connect(){},start(){},stop(){},disconnect(){}};sources.push(source);return source;}};
const binding=createMs91TandyRaceBinding(0x39e1,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,
 initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,
 tone:{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1},sampleGain:0.5,busWrite(port){if(port===0xc5)dacWrites++;}});
const legacyBackend=legacyVirtual&&launchMode==='explicit'?createBrowserLegacyTandyVirtualBackend(context.sampleRate):undefined;
checkedLegacy=legacyBackend;
const menus={setInputActive(value:boolean){active=value;},resetRaceMouse(){},raceEntryKey:()=>0,showRaceWaiting(){},
 async replayMenu(_session:unknown,services:{loadReplay():Promise<void>}){await services.loadReplay();},
 async loadAllocatedRaceReplay(data:Parameters<typeof loadAllocatedReplay>[0],runtime:Parameters<typeof loadAllocatedReplay>[1],services:Pick<Parameters<typeof loadAllocatedReplay>[2],'showWaiting'|'progress'|'writeAudio'>){assert.ok(liveMemory);assert.equal(ms91TandySampleStatus(liveMemory.subarray(0x39e10,0x39e10+3241),0),1,'Actual IRQ stop must finish before replay loader runs');loads++;if(lifecycle==='load-cancel')return undefined;return loadAllocatedReplay(data,runtime,{...services,async selectReplay(memory){memory().set([...Buffer.from('CTKFIN'),0],0x2d1a0+0xea);return 1;},async readReplay(){return new Uint8Array(bytes);},replayPhysicsEngine:()=> 'ms-1990',replayFramesPerSecond:()=>20});},
 async allocatedRaceResults(){return 2;},
 async allocatedRacePresentation(runtime:Awaited<ReturnType<typeof import('../lib/game/native-manual-race-runtime.ts').createNativeManualRaceRuntime>>,pump:()=>void){assert.equal(runtime.session.physicsEngine,loads?'ms-1990':physicsEngine);runtime.session.skipIntroduction();const history=captureGlobalRace(runtime);const checkedPump=async()=>{await pump();if(!runtime.session.replaying){assert.equal(history.inputs.length,runtime.session.length,'Browser Tandy continuation must record every original input for score submission');assert.ok(history.inputs.length>0,'Browser sound path cannot leave submission input history empty');}};if(sampleMode!=='none'&&!loads)runtime.audio.crash(new DataView(runtime.session.state.memory.buffer).getUint16(0x2d1a0+0x8016,true));return {devices:{mouse:()=>({x:160,y:100,buttons:0}),joystickSteering:()=>0,controls:()=>2,keyDown:()=>0},
  key:()=>0,mouseButtons:()=>0,joystickButtons:()=>0,resetMouse(){},control(){},waiting(){},async releaseInput(){},
  presentWorld(){},async nextFrame(){const live=runtime.session.state.memory,v=new DataView(live.buffer,live.byteOffset,live.byteLength),before=v.getUint32(0x2d1a0+0x407a,true);context.currentTime+=0.05;await checkedPump();const after=runtime.session.state.memory;assert.ok(new DataView(after.buffer,after.byteOffset,after.byteLength).getUint32(0x2d1a0+0x407a,true)>before,'Bound audio advances the native game clock');liveMemory=after;capturedMemory=after.slice();presentationFrames++;if(lifecycle.startsWith('load-')&&presentationFrames===1){assert.equal(ms91TandySampleStatus(after.subarray(0x39e10,0x39e10+3241),0),0,'Replay load begins with active sample');runtime.replayControls=async host=>host.menu();runtime.session.finishIteration=async host=>{await host.replayControls();return 'exit';};}else if(lifecycle==='finish')runtime.session.finishIteration=async()=> 'exit';else if(lifecycle==='abort'&&presentationFrames===(replayPlayback?1:20))controller.abort();},close(){closedPresentation++;}};}};
const running=runBrowserNativeManualRace({context,legacyTandyBinding:legacyBackend,data:{...(sampleMode==='none'?fixtureData:sampledTandyBrowserFixture(sampleMode==='differential',lifecycle.startsWith('load-')?4000:6)),soundDevice:{kind:'tandy',driverGeneration:legacyVirtual?'ms-1990':'ms-1991',port61:()=>0,interruptCx:()=>0,bios:legacyVirtual?serviceSuppliedTandySilentRequests:()=>{assert.fail('Unexpected modern BIOS sound');}}},menus,
 menu:{configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'TDStart',camera:0,graphics:2,soundEnabled:true},signal:controller.signal,...(replayPlayback?{replay:{bytes:new Uint8Array(bytes),name:'CTKFIN',path:'',physicsEngine:'ms-1990',framesPerSecond:20}}:{}),...(launchMode==='explicit'&&!legacyVirtual?{tandyBinding:binding}:{}),stopMusic(){}} as never);
if(lifecycle==='abort')await assert.rejects(running,error=>error instanceof DOMException&&error.name==='AbortError');
else{const restored=await running;assert.deepEqual(restored.configuration,Array.from(bytes.subarray(0,24)));assert.deepEqual(restored.track,Array.from(bytes.subarray(24,0x722)));assert.equal(controller.signal.aborted,false);}
assert.ok(buffers.length>0);assert.ok(buffers.every(buffer=>buffer.length===512&&buffer.every(Number.isFinite)));
assert.equal(active,false);assert.equal(closedPresentation,lifecycle==='load-success'?2:1);assert.ok(sources.every(source=>source.buffer===null));assert.throws(()=>binding.render(1),/not attached/);
 binding.close();
assert.ok(capturedMemory);
if(lifecycle.startsWith('load-'))assert.equal(loads,1,'Replay loader invoked once after drain');
if(lifecycle==='abort')assert.equal(presentationFrames,replayPlayback?1:20);else assert.ok(presentationFrames>=1);assert.ok(new DataView(capturedMemory.buffer).getUint16(0x2d1a0+(lifecycle==='load-success'?0x8fd8:0x8c26),true)>0,lifecycle==='load-success'?'Replacement retains recorded replay frames':'Actual driving/replay frames advance');
const capture={buffers,memory:capturedMemory};
if(sampleMode!=='none'&&launchMode==='explicit'&&!legacyVirtual)assert.ok(dacWrites>0,'Custom crash bank reaches actual DAC writes through browser runner');
if(legacyBackend)assert.throws(()=>legacyBackend.render(1),/unavailable/);
if(launchMode==='explicit')references.set(`${physicsEngine}/${replayPlayback}/${sampleMode}/${lifecycle}`,capture);
else assert.deepEqual(capture,references.get(`${physicsEngine}/${replayPlayback}/${sampleMode}/${lifecycle}`),'Explicit binding and automatic modern runner must preserve PCM and entire game memory');
}}finally{if(previousWindow)Object.defineProperty(globalThis,'window',previousWindow);else Reflect.deleteProperty(globalThis,'window');}
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),original);
console.log(legacyVirtual?'Opt-in legacy virtual manual backend passes both physics editions, replay startup, sampled abort/finish and replay load/cancel with source bytes preserved; mocked Web Audio/input':'Both physics editions and legacy replay under modern future routing match PCM/full memory across explicit and automatic modern binding; sampled abort/finish restore menu data and release output, with unchanged source replay; mocked Web Audio/input');
