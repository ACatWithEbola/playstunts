import {advanceOriginalHardwareClock} from './hardware-clock-memory.ts';
import {createBrowserMt32RaceAudio} from './browser-mt32-race-audio.ts';
import type {Mt32StereoOutput} from './mt32-audio-stream.ts';
import {prepareBrowserNativeManualDisplay,type NativeBrowserDisplayMode} from './browser-native-display-race.ts';
import type {NativeSelectedReplay} from './native-allocated-race-preparation.ts';
import {createNativeManualRaceRuntime,reopenNativeManualRaceRuntime,createNativeReplayRaceRuntime} from './native-manual-race-runtime.ts';
import {createBrowserRaceAudio} from './browser-race-audio.ts';
import {createBrowserPcSpeakerRaceAudio} from './browser-pc-speaker-race-audio.ts';
import {createBrowserTandyRaceAudio} from './browser-tandy-race-audio.ts';
import {runBrowserAllocatedRaceLoop} from './browser-allocated-race-loop.ts';
import type {createBrowserNativeMenus} from './browser-native-menus.ts';
import type {NativeDemoData,NativeDemoMenuState} from './native-demo-runtime.ts';
type Menus=Awaited<ReturnType<typeof createBrowserNativeMenus>>;
/** Original manual race/results repetition, retaining one recording bank,
 * saved menu state and browser OPL stream until the player returns to menus. */
export async function runBrowserNativeManualRace(options:{context:AudioContext;data:NativeDemoData;menus:Menus;menu:NativeDemoMenuState&{mouse?:boolean;joystick?:boolean};signal:AbortSignal;displayMode?:NativeBrowserDisplayMode;hercules?:boolean;mt32Output?:Mt32StereoOutput;replay?:NativeSelectedReplay;stopMusic():void;onStage?:(stage:'loading'|'race'|'results'|'seeking')=>void;onFrame?:(frame:number,mode:number,clock:number,blocked:number)=>void}){
 if(options.data.soundDevice?.kind==='mt32'&&!options.mt32Output)throw Error('Roland race requires an initialized synthesizer output');
 let rolandAudio:ReturnType<typeof createBrowserMt32RaceAudio>|undefined;
 const {context,menus,signal}=options;let pcAudio:ReturnType<typeof createBrowserPcSpeakerRaceAudio>|undefined;
 const data=options.data.soundDevice?.kind==='pc-speaker'?{...options.data,soundDevice:{kind:'pc-speaker' as const,port61:()=>pcAudio?.port61??0}}:options.data.soundDevice?.kind==='tandy'?{...options.data,soundDevice:{...options.data.soundDevice,port61:()=>pcAudio?.port61??0}}:options.data;
 const aborted=()=>{if(signal.aborted)throw new DOMException('Native race closed','AbortError');};
 const progress=(stage:number)=>{const name=({2:'SDTITL.PVS',3:'TEDIT.PRE',4:'OPP1.PRE'} as Record<number,string>)[stage];if(!name||!data.catalog.exists(name))throw Error('Original disk-presence resource missing for stage '+stage);};
 let presentation:Awaited<ReturnType<Menus['allocatedRacePresentation']>>|undefined,audio:Awaited<ReturnType<typeof createBrowserRaceAudio>>|undefined;
 aborted();options.onStage?.(options.replay?'seeking':'loading');menus.setInputActive(true);const waiting=options.replay?data.base.slice():data.base;if(options.replay)new DataView(waiting.buffer).setUint16(0x2d1a0+0x8a10,150,true);menus.showRaceWaiting(waiting);
 try{
  let runtime=options.replay?await createNativeReplayRaceRuntime(data,options.menu,options.replay,{resetMouse:menus.resetRaceMouse,async key(){aborted();return menus.raceEntryKey();}},progress):await createNativeManualRaceRuntime(data,options.menu,{resetMouse:menus.resetRaceMouse},progress);aborted();
  audio=data.soundDevice?.kind==='mt32'?(rolandAudio=createBrowserMt32RaceAudio(context,options.mt32Output!,[],()=>runtime.tick(presentation!.devices))):data.soundDevice?.kind==='tandy'?(pcAudio=createBrowserTandyRaceAudio(context,runtime.initialWrites,()=>runtime.tick(presentation!.devices))):data.soundDevice?.kind==='pc-speaker'?(pcAudio=createBrowserPcSpeakerRaceAudio(context,runtime.initialWrites,()=>runtime.tick(presentation!.devices))):await createBrowserRaceAudio(context,runtime.initialWrites,()=>runtime.tick(presentation!.devices));aborted();
  rolandAudio?.prepare(runtime.initialWrites);
  const pump=()=>{aborted();audio!.pump();},showWaiting=()=>presentation?presentation.waiting():menus.showRaceWaiting(runtime.session.state.memory);
  const preparePresentation=async()=>{const alternate=options.displayMode?await prepareBrowserNativeManualDisplay(data,options.displayMode,()=>runtime.session.state.memory,options.hercules):undefined;aborted();if(alternate)runtime.useDisplay(alternate.display);return menus.allocatedRacePresentation(runtime,pump,alternate);};
  presentation=await preparePresentation();
  for(;;){
   options.onStage?.('race');
   runtime=await runBrowserAllocatedRaceLoop(runtime,menus,presentation,audio,{signal,showWaiting,onFrame:options.onFrame,
    async loadReplay(before){
     const loaded=await menus.loadAllocatedRaceReplay(data,before,{showWaiting,progress,writeAudio:audio!.write},presentation);aborted();
     if(!loaded)return;runtime=loaded;presentation=await preparePresentation();return {runtime,presentation};
    },
   });
   aborted();if(!runtime.session.state.memory[0x2d1a0+0x8018])break;
   rolandAudio?.suspend(()=>{advanceOriginalHardwareClock(runtime.session.state.memory,0x2d1a0);});options.onStage?.('results');const action=await menus.allocatedRaceResults(data,runtime,progress,options.displayMode);options.stopMusic();aborted();
   if(action!==0&&action!==1)break;
   options.onStage?.(action===0?'seeking':'loading');showWaiting();
   runtime=await reopenNativeManualRaceRuntime(data,runtime.session.state.memory,action===0?'replay':'fresh',{resetMouse:menus.resetRaceMouse,async key(){aborted();return menus.raceEntryKey();}},progress);aborted();if(rolandAudio)rolandAudio.prepare(runtime.initialWrites);else audio.write(runtime.initialWrites);
   const previous=presentation;presentation=await preparePresentation();previous.close();rolandAudio?.resume();
  }
  return runtime.releaseMenuState();
 }finally{presentation?.close();audio?.close();options.stopMusic();menus.setInputActive(false);}
}
