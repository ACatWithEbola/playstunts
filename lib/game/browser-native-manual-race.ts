import {advanceOriginalHardwareClock,advanceOriginalNestedHardwareClock} from './hardware-clock-memory.ts';
import {createBrowserMt32RaceAudio} from './browser-mt32-race-audio.ts';
import type {Mt32StereoOutput} from './mt32-audio-stream.ts';
import {prepareBrowserNativeManualDisplay,type NativeBrowserDisplayMode} from './browser-native-display-race.ts';
import type {NativeSelectedReplay} from './native-allocated-race-preparation.ts';
import {createNativeManualRaceRuntime,reopenNativeManualRaceRuntime,createNativeReplayRaceRuntime} from './native-manual-race-runtime.ts';
import {selectBrowserFutureRaceEngine} from './browser-future-race-engine.ts';
import {activeRaceData} from './active-race-data.ts';
import {futureRaceSettings,replayVideoSettings} from './future-race-settings.ts';
import {createBrowserRaceAudio} from './browser-race-audio.ts';
import {createBrowserPcSpeakerRaceAudio} from './browser-pc-speaker-race-audio.ts';
import {createBrowserTandyRaceAudio} from './browser-tandy-race-audio.ts';
import type {createMs91TandyRaceBinding} from './ms91-tandy-race-binding.ts';
import {createBrowserModernTandyBackend} from './browser-modern-tandy-backend.ts';
import type {createBrowserLegacyTandyVirtualBackend} from './browser-legacy-tandy-virtual-backend.ts';
import {createBrowserLegacyTandyBackend} from './browser-legacy-tandy-backend.ts';
import {rebindNativeSoundPort} from './rebind-native-sound-port.ts';
import {runBrowserAllocatedRaceLoop} from './browser-allocated-race-loop.ts';
import type {BrowserNativeRaceAudio} from './browser-allocated-race-loop.ts';
import {createBrowserAllocatedTimedMt32Race} from './browser-allocated-timed-mt32-race.ts';
import type {BrowserTimedDemoRoland} from './browser-native-demo.ts';
import type {createBrowserNativeMenus} from './browser-native-menus.ts';
import type {NativeDemoData,NativeDemoMenuState} from './native-demo-runtime.ts';
type Menus=Awaited<ReturnType<typeof createBrowserNativeMenus>>;
type ManualRaceAudio=BrowserNativeRaceAudio;
/** Original manual race/results repetition, retaining one recording bank,
 * saved menu state and browser OPL stream until the player returns to menus. */
export async function runBrowserNativeManualRace(options:{context:AudioContext;data:NativeDemoData;menus:Menus;menu:NativeDemoMenuState&{mouse?:boolean;joystick?:boolean};signal:AbortSignal;displayMode?:NativeBrowserDisplayMode;hercules?:boolean;mt32Output?:Mt32StereoOutput;timedMt32?:BrowserTimedDemoRoland;tandyBinding?:ReturnType<typeof createMs91TandyRaceBinding>;legacyTandyBinding?:ReturnType<typeof createBrowserLegacyTandyVirtualBackend>;replay?:NativeSelectedReplay;stopMusic():void|Promise<void>;onStage?:(stage:'loading'|'race'|'results'|'seeking')=>void;onFrame?:(frame:number,mode:number,clock:number,blocked:number)=>void}){
 if(options.legacyTandyBinding&&(options.tandyBinding||options.data.soundDevice?.kind!=='tandy'||(options.data.soundDevice.driverGeneration??'ms-1990')!=='ms-1990'||options.legacyTandyBinding.sampleRate!==options.context.sampleRate))throw Error('Legacy virtual Tandy requires exclusive matching legacy driver/rate');
 if(options.timedMt32&&(options.data.soundDevice?.kind!=='mt32'||(options.data.soundDevice.driverGeneration??'ms-1990')!==options.timedMt32.generation))throw Error('Timed Roland race requires matching allocated driver generation');
 if(options.timedMt32)options={...options,timedMt32:{...options.timedMt32,profile:{...options.timedMt32.profile},patch:Uint8Array.from(options.timedMt32.patch)}};
 if(!options.tandyBinding){const backend=createBrowserModernTandyBackend(options.context.sampleRate,options.data.soundDevice);if(backend)options={...options,tandyBinding:backend};}
 if(!options.tandyBinding&&!options.legacyTandyBinding){const backend=createBrowserLegacyTandyBackend(options.context.sampleRate,options.data.soundDevice);if(backend)options={...options,legacyTandyBinding:backend};}
 if(options.tandyBinding&&(options.data.soundDevice?.kind!=='tandy'||options.data.soundDevice.driverGeneration!=='ms-1991'||options.tandyBinding.sampleRate!==options.context.sampleRate))throw Error('Full Tandy binding requires matching modern driver and browser audio rate');
 if(options.data.soundDevice?.kind==='mt32'&&!options.mt32Output&&!options.timedMt32)throw Error('Roland race requires an initialized synthesizer output');
 if(options.timedMt32){if(options.signal.aborted)throw new DOMException('Native race closed','AbortError');await options.timedMt32.stopMusic();if(options.signal.aborted)throw new DOMException('Native race closed','AbortError');}
 let rolandAudio:ReturnType<typeof createBrowserMt32RaceAudio>|undefined;
 let timedAudio:Awaited<ReturnType<typeof createBrowserAllocatedTimedMt32Race>>|undefined;
 let tandyAudio:ReturnType<typeof createBrowserTandyRaceAudio>|undefined;
 const {context,menus,signal}=options;let pcAudio:ReturnType<typeof createBrowserPcSpeakerRaceAudio>|undefined;
 const audioData={...options.data,soundDevice:rebindNativeSoundPort(options.data.soundDevice,()=>pcAudio?.port61??0)};
 if(options.tandyBinding&&audioData.soundDevice?.kind==='tandy')audioData.soundDevice={...audioData.soundDevice,sampleStarts:options.tandyBinding.sampleStarts};
 const data=replayVideoSettings(audioData,menus.ms91GraphicsSettings);
 const aborted=()=>{if(signal.aborted)throw new DOMException('Native race closed','AbortError');};
 const freshRaceData=futureRaceSettings(data,selectBrowserFutureRaceEngine(),menus.ms91GraphicsSettings);
 const progress=(stage:number)=>{const name=({2:'SDTITL.PVS',3:'TEDIT.PRE',4:'OPP1.PRE'} as Record<number,string>)[stage];if(!name||!data.catalog.exists(name))throw Error('Original disk-presence resource missing for stage '+stage);};
 let presentation:Awaited<ReturnType<Menus['allocatedRacePresentation']>>|undefined,audio:ManualRaceAudio|undefined;
 aborted();options.onStage?.(options.replay?'seeking':'loading');menus.setInputActive(true);const waiting=options.replay?data.base.slice():data.base;if(options.replay)new DataView(waiting.buffer).setUint16(0x2d1a0+0x8a10,150,true);menus.showRaceWaiting(waiting);
 try{
  let runtime=options.replay?await createNativeReplayRaceRuntime(data,options.menu,options.replay,{resetMouse:menus.resetRaceMouse,async key(){aborted();return menus.raceEntryKey();}},progress):await createNativeManualRaceRuntime(freshRaceData,options.menu,{resetMouse:menus.resetRaceMouse},progress);aborted();
  const attachTandy=()=>{const attached=runtime;options.tandyBinding?.attach(()=>attached.session.state.memory,()=>attached.tick(presentation!.devices),()=>attached.tickProgram(presentation!.devices),()=>{advanceOriginalNestedHardwareClock(attached.session.state.memory,0x2d1a0);});options.legacyTandyBinding?.attach(()=>attached.session.state.memory,()=>attached.tickProgram(presentation!.devices,true));};
  attachTandy();
  const acquireTimed=async()=>{const selected=options.timedMt32!,profile={...selected.profile};return createBrowserAllocatedTimedMt32Race(context,selected.device,{generation:selected.generation,patch:selected.patch,profile:{...profile,cancelled:()=>signal.aborted||profile.cancelled()},runtime:()=>runtime,devices:()=>presentation!.devices,active:()=>!signal.aborted,onScheduled:selected.onScheduled});};
  audio=options.timedMt32?(timedAudio=await acquireTimed()):data.soundDevice?.kind==='mt32'?(rolandAudio=createBrowserMt32RaceAudio(context,options.mt32Output!,[],()=>runtime.tick(presentation!.devices))):data.soundDevice?.kind==='tandy'?(pcAudio=createBrowserTandyRaceAudio(context,runtime.initialWrites,()=>runtime.tick(presentation!.devices),options.tandyBinding??options.legacyTandyBinding)):data.soundDevice?.kind==='pc-speaker'?(pcAudio=createBrowserPcSpeakerRaceAudio(context,runtime.initialWrites,()=>runtime.tick(presentation!.devices))):await createBrowserRaceAudio(context,runtime.initialWrites,()=>runtime.tick(presentation!.devices));aborted();
  if(data.soundDevice?.kind==='tandy')tandyAudio=pcAudio as ReturnType<typeof createBrowserTandyRaceAudio>;
  rolandAudio?.prepare(runtime.initialWrites);
  const pump=async()=>{aborted();await audio!.pump();aborted();},showWaiting=()=>presentation?presentation.waiting():menus.showRaceWaiting(runtime.session.state.memory);
  const preparePresentation=async()=>{const alternate=options.displayMode?await prepareBrowserNativeManualDisplay(activeRaceData(data,runtime.session),options.displayMode,()=>runtime.session.state.memory,options.hercules):undefined;aborted();if(alternate)runtime.useDisplay(alternate.display);return menus.allocatedRacePresentation(runtime,pump,alternate);};
  presentation=await preparePresentation();
  const drainTandy=async()=>{
   if(options.legacyTandyBinding?.status().carry){const stopped=await options.legacyTandyBinding.stopForResourceRelease(async()=>{await presentation!.nextFrame();aborted();await audio!.pump();},signal);if(!stopped){aborted();throw Error('Legacy Tandy resource stop incomplete');}}
   if(options.tandyBinding?.status(0)===0){
    const stopped=await options.tandyBinding.stopForResourceRelease(async()=>{await presentation!.nextFrame();aborted();},signal);
    if(!stopped){aborted();throw Error('Tandy sample stop did not complete before resource release');}
   }
  };
  for(;;){
   options.onStage?.('race');
   runtime=await runBrowserAllocatedRaceLoop(runtime,menus,presentation,audio,{signal,showWaiting,onFrame:options.onFrame,
    beforeFinish:drainTandy,
    async loadReplay(before){
     await drainTandy();
     await timedAudio?.suspendAsync();
     tandyAudio?.suspend();
     const loaded=await menus.loadAllocatedRaceReplay(data,before,{showWaiting,progress,writeAudio:audio!.write},presentation);aborted();
     if(!loaded){timedAudio?.resume();tandyAudio?.resume();return;}runtime=loaded;attachTandy();presentation=await preparePresentation();timedAudio?.resume();tandyAudio?.resume();return {runtime,presentation};
    },
   });
   aborted();if(!runtime.session.state.memory[0x2d1a0+0x8018])break;
   tandyAudio?.suspend();
   await timedAudio?.closeAsync();
   rolandAudio?.suspend(()=>{advanceOriginalHardwareClock(runtime.session.state.memory,0x2d1a0);});options.onStage?.('results');const action=await menus.allocatedRaceResults(activeRaceData(data,runtime.session),runtime,progress,options.displayMode);await options.stopMusic();aborted();
   if(action!==0&&action!==1)break;
   if(options.tandyBinding?.status(0)===0)throw Error('Race replacement requires completed Tandy sample stop');
   options.onStage?.(action===0?'seeking':'loading');showWaiting();
   runtime=await reopenNativeManualRaceRuntime(action===0?{...data,physicsEngine:runtime.session.physicsEngine,framesPerSecond:runtime.session.framesPerSecond}:freshRaceData,runtime.session.state.memory,action===0?'replay':'fresh',{resetMouse:menus.resetRaceMouse,async key(){aborted();return menus.raceEntryKey();}},progress);aborted();attachTandy();if(options.timedMt32)audio=timedAudio=await acquireTimed();else if(rolandAudio)rolandAudio.prepare(runtime.initialWrites);else await audio.write(runtime.initialWrites);
   const previous=presentation;presentation=await preparePresentation();previous.close();rolandAudio?.resume();tandyAudio?.resume();
  }
  return runtime.releaseMenuState();
 }finally{
  try{presentation?.close();}
  finally{
   try{if(audio?.closeAsync)await audio.closeAsync();else audio?.close();}
   finally{
    try{options.tandyBinding?.close();}
    finally{
     try{options.legacyTandyBinding?.close();}
     finally{try{await options.stopMusic();}finally{menus.setInputActive(false);}}
    }
   }
  }
 }
}
