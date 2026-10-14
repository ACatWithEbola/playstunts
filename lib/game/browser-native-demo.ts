import type {BrowserGraphicsSwitch} from './browser-native-menus';
import {fallbackToOriginalGraphics} from './browser-graphics-fallback.ts';
import {createUpgradedRaceScene} from './upgraded-race-scene';
import {focusBrowserGameCanvas} from './browser-game-focus.ts';
import {createBrowserMt32RaceAudio} from './browser-mt32-race-audio.ts';
import type {Mt32StereoOutput} from './mt32-audio-stream.ts';
import {createBrowserHerculesPresenter} from './browser-hercules-presenter.ts';
import {prepareBrowserNativeDisplayRace,type NativeBrowserDisplayMode} from './browser-native-display-race.ts';
import {createNativeDemoRuntime,type NativeDemoData,type NativeDemoMenuState} from './native-demo-runtime.ts';
import {loadBrowserOriginalResourceCatalog} from './native-resource-catalog.ts';
import {createBrowserRaceAudio} from './browser-race-audio.ts';
import {createBrowserPcSpeakerRaceAudio} from './browser-pc-speaker-race-audio.ts';
import {createBrowserTandyRaceAudio} from './browser-tandy-race-audio.ts';
import type {createMs91TandyRaceBinding} from './ms91-tandy-race-binding.ts';
import {createBrowserModernTandyBackend} from './browser-modern-tandy-backend.ts';
import type {createBrowserLegacyTandyVirtualBackend} from './browser-legacy-tandy-virtual-backend.ts';
import {createBrowserLegacyTandyBackend} from './browser-legacy-tandy-backend.ts';
import {rebindNativeSoundPort} from './rebind-native-sound-port.ts';
import type {BrowserNativeRaceAudio} from './browser-allocated-race-loop.ts';
import {createBrowserAllocatedTimedMt32Race} from './browser-allocated-timed-mt32-race.ts';
export interface BrowserTimedDemoRoland {
 device:Parameters<typeof createBrowserAllocatedTimedMt32Race>[1];
 generation:'ms-1990'|'ms-1991';patch:Uint8Array;
 profile:Parameters<typeof createBrowserAllocatedTimedMt32Race>[2]['profile'];
 stopMusic():Promise<void>;
 onScheduled?:Parameters<typeof createBrowserAllocatedTimedMt32Race>[2]['onScheduled'];
}
import {createBrowserMenuInput} from './browser-menu-input.ts';
import {pollAudioDuringFrameWait} from './frame-wait-audio-poll.ts';
import type {Assets} from './types.ts';
import {selectBrowserFutureRaceEngine} from './browser-future-race-engine.ts';
import {versionedDemoResource} from './versioned-demo-resource.ts';
export interface BrowserNativeDemoData extends NativeDemoData {palette:number[]}
export async function loadBrowserNativeDemoData(assets:Assets):Promise<BrowserNativeDemoData>{
 const json=async<T>(name:string):Promise<T>=>{const r=await fetch('/game/'+name+'.json');if(!r.ok)throw Error('Original demo data could not load: '+name);return r.json() as Promise<T>;};
 const base=async()=>{const r=await fetch('/game/native-resource-base.bin');if(!r.ok)throw Error('Original native resource base could not load');return new Uint8Array(await r.arrayBuffer());};
 const [memory,catalog,records,vectors,samples,objects,points,indices,planes,walls,materials]=await Promise.all([base(),loadBrowserOriginalResourceCatalog(),json<NativeDemoData['records']>('route-records'),json<NativeDemoData['vectors']>('route-vectors'),json<NativeDemoData['samples']>('route-sample-vectors'),json<NativeDemoData['objects']>('track-objects'),json<NativeDemoData['points']>('route-point-vectors'),json<NativeDemoData['indices']>('route-speed-indices'),json<NativeDemoData['planes']>('collision-planes'),json<{walls:NativeDemoData['walls']}>('collision-walls'),json<{palette:number[]}>('track-materials')]);
 return {base:memory,catalog,cars:assets.cars as unknown as NativeDemoData['cars'],records,vectors,samples,objects,points,indices,planes,walls:walls.walls,palette:materials.palette};
}
/** Browser presentation and one sample-aligned native race/audio clock.
 * The original demo owns its game memory; the menu's saved state is returned. */
export async function runBrowserNativeDemo(options:{assets?:Assets;graphicsSwitch?:BrowserGraphicsSwitch;canvas:HTMLCanvasElement;context:AudioContext;data:BrowserNativeDemoData;menu:NativeDemoMenuState;joystickEnabled?:boolean;displayMode?:NativeBrowserDisplayMode;hercules?:boolean;mt32Output?:Mt32StereoOutput;timedMt32?:BrowserTimedDemoRoland;tandyBinding?:ReturnType<typeof createMs91TandyRaceBinding>;legacyTandyBinding?:ReturnType<typeof createBrowserLegacyTandyVirtualBackend>;signal:AbortSignal;progress?:(stage:number)=>void;onFrame?:(frame:number,length:number)=>void}){
 if(options.legacyTandyBinding&&(options.tandyBinding||options.data.soundDevice?.kind!=='tandy'||(options.data.soundDevice.driverGeneration??'ms-1990')!=='ms-1990'||options.legacyTandyBinding.sampleRate!==options.context.sampleRate))throw Error('Legacy virtual Tandy requires exclusive matching legacy driver/rate');
 if(options.timedMt32&&(options.data.soundDevice?.kind!=='mt32'||(options.data.soundDevice.driverGeneration??'ms-1990')!==options.timedMt32.generation))throw Error('Timed Roland demo requires matching allocated driver generation');
 if(options.timedMt32)options={...options,timedMt32:{...options.timedMt32,profile:{...options.timedMt32.profile},patch:Uint8Array.from(options.timedMt32.patch)}};
 if(!options.tandyBinding){const backend=createBrowserModernTandyBackend(options.context.sampleRate,options.data.soundDevice);if(backend)options={...options,tandyBinding:backend};}
 if(!options.tandyBinding&&!options.legacyTandyBinding){const backend=createBrowserLegacyTandyBackend(options.context.sampleRate,options.data.soundDevice);if(backend)options={...options,legacyTandyBinding:backend};}
 if(options.tandyBinding&&(options.data.soundDevice?.kind!=='tandy'||options.data.soundDevice.driverGeneration!=='ms-1991'||options.tandyBinding.sampleRate!==options.context.sampleRate))throw Error('Full Tandy binding requires matching modern driver and browser audio rate');
 if(options.data.soundDevice?.kind==='mt32'&&!options.mt32Output&&!options.timedMt32)throw Error('Roland demo requires an initialized synthesizer output');
 if(options.timedMt32){
  if(options.signal.aborted)throw new DOMException('Native demo closed','AbortError');
  await options.timedMt32.stopMusic();
  if(options.signal.aborted)throw new DOMException('Native demo closed','AbortError');
 }
 const {canvas,context,signal}=options;let pcAudio:ReturnType<typeof createBrowserPcSpeakerRaceAudio>|undefined;
 const audioData={...options.data,soundDevice:rebindNativeSoundPort(options.data.soundDevice,()=>pcAudio?.port61??0)};
 if(options.tandyBinding&&audioData.soundDevice?.kind==='tandy')audioData.soundDevice={...audioData.soundDevice,sampleStarts:options.tandyBinding.sampleStarts};
 const demoReplay=versionedDemoResource(selectBrowserFutureRaceEngine());
 const data=demoReplay?{...audioData,demoReplay,physicsEngine:demoReplay.physicsEngine,framesPerSecond:demoReplay.framesPerSecond,experimental10Hz:true}:audioData;
 const aborted=()=>{if(signal.aborted)throw new DOMException('Native demo closed','AbortError');};aborted();
 const runtime=await createNativeDemoRuntime(data,options.menu,options.progress);aborted();
 const alternate=options.displayMode?await prepareBrowserNativeDisplayRace(data,options.displayMode,runtime.session.state.memory,options.hercules):undefined;aborted();
 const palette=alternate?.palette??data.palette;
 const graphics=options.graphicsSwitch;let upgraded:ReturnType<typeof createUpgradedRaceScene>|undefined;
 if(graphics){runtime.enableGraphicsCapture();graphics.resetPerformance?.();}
 let upgradedFrame=-1;
 options.tandyBinding?.attach(()=>runtime.session.state.memory,()=>runtime.tick(),()=>runtime.tickProgram(),()=>{advanceOriginalNestedHardwareClock(runtime.session.state.memory,0x2d1a0);});
 options.legacyTandyBinding?.attach(()=>runtime.session.state.memory,()=>runtime.tickProgram(true));
 const audio:BrowserNativeRaceAudio=await (async()=>{try{
  if(options.timedMt32){
   const selected=options.timedMt32,profile={...selected.profile};
   const forbidden=()=>{throw Error('Recorded demo requested live driving input');};
   return await createBrowserAllocatedTimedMt32Race(context,selected.device,{generation:selected.generation,patch:selected.patch,profile:{...profile,cancelled:()=>signal.aborted||profile.cancelled()},runtime:()=>runtime,devices:()=>({mouse:forbidden,joystickSteering:forbidden,controls:forbidden,keyDown:forbidden}),active:()=>!signal.aborted,onScheduled:selected.onScheduled});
  }
  return data.soundDevice?.kind==='mt32'?createBrowserMt32RaceAudio(context,options.mt32Output!,runtime.initialWrites,()=>runtime.tick()):data.soundDevice?.kind==='tandy'?(pcAudio=createBrowserTandyRaceAudio(context,runtime.initialWrites,()=>runtime.tick(),options.tandyBinding??options.legacyTandyBinding)):data.soundDevice?.kind==='pc-speaker'?(pcAudio=createBrowserPcSpeakerRaceAudio(context,runtime.initialWrites,()=>runtime.tick())):await createBrowserRaceAudio(context,runtime.initialWrites,()=>runtime.tick());
 }catch(error){options.tandyBinding?.close();options.legacyTandyBinding?.close();throw error;}})();
 if(signal.aborted){try{if(audio.closeAsync)await audio.closeAsync();else audio.close();}finally{options.tandyBinding?.close();options.legacyTandyBinding?.close();}aborted();}
 const input=createBrowserMenuInput(canvas,{async onPoll(){aborted();await audio.pump();aborted();},joystickEnabled:()=>!!options.joystickEnabled,drivingBindings:()=>runtime.session.state.memory.subarray(0x2d1a0+0x430a,0x2d1a0+0x4314)});
 const surface=document.createElement('canvas');surface.width=320;surface.height=200;
 const raster=surface.getContext('2d')!,drawing=canvas.getContext('2d')!,image=raster.createImageData(320,200);
 let animation=0,rejectFrame:((reason:DOMException)=>void)|undefined,lastFrame=-1;
 const abort=()=>{cancelAnimationFrame(animation);input.close();rejectFrame?.(new DOMException('Native demo closed','AbortError'));};signal.addEventListener('abort',abort);
 const frame=async()=>{const pending=new Promise<void>((resolve,reject)=>{aborted();rejectFrame=reject;animation=requestAnimationFrame(()=>{rejectFrame=undefined;resolve();});});if(options.timedMt32?.generation==='ms-1991'&&!canvas.ownerDocument.hidden)await pollAudioDuringFrameWait(pending,async()=>{aborted();await audio.pump();aborted();},()=>!signal.aborted&&!canvas.ownerDocument.hidden);else await pending;};
 const writeAudio=audio.write;
 const presentHercules=options.hercules?createBrowserHerculesPresenter(canvas):undefined;
 const present=()=>{
  const pixels=alternate?alternate.render(runtime.session.state.memory):runtime.render();if(presentHercules){if(!alternate)throw Error("Hercules requires the original CGA renderer");presentHercules(alternate.owner);}else{for(let i=0;i<64000;i++){const at=pixels[i]*3;image.data[i*4]=palette[at];image.data[i*4+1]=palette[at+1];image.data[i*4+2]=palette[at+2];image.data[i*4+3]=255;}
  raster.putImageData(image,0,0);drawing.setTransform(1,0,0,1,0,0);drawing.imageSmoothingEnabled=false;drawing.drawImage(surface,0,0,canvas.width,canvas.height);
  }
  redraw();
  canvas.dataset.demoFrame=String(runtime.frame);canvas.dataset.demoCamera=String(runtime.session.state.memory[0x2d1a0+0x12f]);options.onFrame?.(runtime.frame,runtime.length);
 };
 const redraw=()=>{if(!graphics)return;graphics.refresh=redraw;if(!graphics.enabled){drawing.setTransform(1,0,0,1,0,0);drawing.imageSmoothingEnabled=false;if(presentHercules&&alternate)presentHercules(alternate.owner);else drawing.drawImage(surface,0,0,canvas.width,canvas.height);return;}if(!options.assets)return;try{if(alternate&&upgradedFrame!==runtime.frame){runtime.render(true);upgradedFrame=runtime.frame;}upgraded??=createUpgradedRaceScene(options.assets,runtime.session.state.memory,runtime,()=>graphics.chaseCamera??0,()=>graphics.selectOriginalCamera?.());if(upgraded.draw(canvas))graphics.performanceFrame?.(performance.now());}catch{fallbackToOriginalGraphics(graphics,()=>upgraded?.close());upgraded=undefined;drawing.setTransform(1,0,0,1,0,0);drawing.imageSmoothingEnabled=false;if(presentHercules&&alternate)presentHercules(alternate.owner);else drawing.drawImage(surface,0,0,canvas.width,canvas.height);}};
 try{
  focusBrowserGameCanvas(canvas);canvas.style.cursor='none';canvas.dataset.nativeDemo='running';
  await context.resume();aborted();present();
  for(;;){
   await frame();aborted();
   await audio.pump();aborted();
   if(runtime.frame!==lastFrame){present();lastFrame=runtime.frame;}else if(graphics?.enabled)redraw();
   if(runtime.finishFrame(input.takeKey(),input.controls())==='exit')break;
  }
  canvas.dataset.nativeDemo='returning';
  if(options.legacyTandyBinding?.status().carry){const stopped=await options.legacyTandyBinding.stopForResourceRelease(async()=>{await frame();aborted();await audio.pump();aborted();},signal);if(!stopped){aborted();throw Error('Legacy Tandy demo resource stop incomplete');}}
  if(options.tandyBinding?.status(0)===0){
   const stopped=await options.tandyBinding.stopForResourceRelease(async()=>{await frame();aborted();await audio.pump();aborted();},signal);
   if(!stopped){aborted();throw Error('Tandy sample stop did not complete before demo release');}
  }
  const restored=await runtime.finish({writeAudio,async gameCounter(){await frame();aborted();await audio.pump();aborted();const memory=runtime.session.state.memory;return new DataView(memory.buffer,memory.byteOffset,memory.byteLength).getUint32(0x2d1a0+0x407a,true);},releaseInput:input.release,showWaiting(){},copyBackBuffer(){},resetMouse(){}});
  canvas.dataset.nativeDemo='complete';return restored;
 }finally{
  try{upgraded?.close();}
  finally{
   try{graphics?.resetPerformance?.();}
   finally{
    if(graphics?.refresh===redraw)graphics.refresh=undefined;
    try{signal.removeEventListener('abort',abort);cancelAnimationFrame(animation);input.close();}
    finally{
     try{if(audio.closeAsync)await audio.closeAsync();else audio.close();}
     finally{
      try{options.tandyBinding?.close();}
      finally{try{options.legacyTandyBinding?.close();}finally{if(signal.aborted)canvas.dataset.nativeDemo='closed';}}
     }
    }
   }
  }
 }
}
import {advanceOriginalNestedHardwareClock} from './hardware-clock-memory.ts';
