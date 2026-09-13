import {createRaceOverlayMaskRenderer} from './race-overlay-mask.ts';
import {readRetainedMenuSession} from './retained-menu-session.ts';
import type {NativeManualRaceDisplay} from './native-manual-display.ts';
import {drawOriginalReplayWait} from './replay-wait-message.ts';
import {controlNativeAllocatedDialogSound,createNativeAllocatedSound} from './native-race-sound-device.ts';
import {advanceOriginalHardwareClock} from './hardware-clock-memory.ts';
import {finishCompleteNativeRace,type CompleteRaceExitHost} from './complete-race-exit.ts';
import {restoreOriginalRaceMenuState} from './race-menu-state.ts';
import {dispatchRaceFrameSounds} from './race-frame-sounds.ts';
import {createAllocatedReplayControl} from './allocated-replay-control.ts';
import {drawNativeFullRedrawRaceLayers} from './full-redraw-race-layers.ts';
import {createNativeManualRaceSession,reopenNativeManualRaceSession,createLoadedNativeManualRaceSession,createNativeReplayRaceSession} from './native-manual-race-session.ts';
import {advanceAllocatedRace,type AllocatedRaceDevices} from './advance-allocated-race.ts';
import {createNativeOriginalRenderer} from './native-original-renderer.ts';
import {prepareOriginalRaceViewport} from './race-viewport.ts';
import {analyzeRoute} from '../physics/route-analysis.ts';
/** Native manual simulation/audio clock. The browser owns complete cockpit,
 * replay/results presentation and the asynchronous iteration-end services. */
export async function createNativeManualRaceRuntime(...args:Parameters<typeof createNativeManualRaceSession>){
 return attachManualRaceRuntime(args[0],await createNativeManualRaceSession(...args));
}
export async function createNativeReplayRaceRuntime(...args:Parameters<typeof createNativeReplayRaceSession>){return attachManualRaceRuntime(args[0],await createNativeReplayRaceSession(...args));}
export async function reopenNativeManualRaceRuntime(...args:Parameters<typeof reopenNativeManualRaceSession>){
 return attachManualRaceRuntime(args[0],await reopenNativeManualRaceSession(...args));
}
export function createLoadedNativeManualRaceRuntime(...args:Parameters<typeof createLoadedNativeManualRaceSession>){return attachManualRaceRuntime(args[0],createLoadedNativeManualRaceSession(...args));}
function attachManualRaceRuntime(data:Parameters<typeof createNativeManualRaceSession>[0],prepared:Awaited<ReturnType<typeof createNativeManualRaceSession>>){
 const {session}=prepared,d=0x2d1a0,bp=0xeefe;
 const audio=createNativeAllocatedSound(()=>session.state.memory,d,0x39e1,data.soundDevice);
 const renderer=createNativeOriginalRenderer(session.state.memory,prepared.raw,analyzeRoute(prepared.raw,data.records,data.vectors,data.samples,data.objects,undefined,{sample:false}),{allocatedResources:true,originalViewport:true,originalCameras:{objects:data.objects,planes:data.planes}});
 let captureGraphics=false;
 let graphicsSource:Uint8Array|undefined,graphicsLive:Uint8Array|undefined,graphicsMask:Uint8Array|undefined,graphicsRevision=0,graphicsKey='',hasPendingGraphics=false;
 const pendingGraphics=new Uint8Array(session.state.memory.length);
 const renderGraphicsMask=createRaceOverlayMaskRenderer();
 let rendering:Uint8Array|undefined,finished=false,released=false,display:NativeManualRaceDisplay|undefined,displayRendered=false;
 const nextGraphicsKey=(live:Uint8Array)=>{const view=renderer.view!,v=new DataView(live.buffer,live.byteOffset,live.byteLength);return [v.getUint16(d+0x8c26,true),live[d+0xa3c2],live[d+0x12f],live[d+0xa9f0],live[d+0x134],live[d+0x9ab6],live[d+0xaae6],live[d+0x90f8],live[d+0x8eab],live[d+0xa42a],live[d+0x8f13],live[d+0x8f14],live[d+0x8fbd],v.getUint16(d+0xa034,true),v.getUint16(d+0x73b2,true),v.getUint16(d+0xa7da,true),...view.position,...view.angles,...view.rectangle,...view.projection].join('/')};
 const controlReplay=createAllocatedReplayControl(()=>session.state.memory,()=>{if(!rendering)throw Error('Replay drawing requires the retained race framebuffer');return rendering;},d);
 return {...prepared,audio,
  enableGraphicsCapture(){captureGraphics=true;},
  graphicsFrame(){if(hasPendingGraphics){hasPendingGraphics=false;renderer.render(pendingGraphics,undefined,undefined,undefined,true,(memory,world)=>{rendering=memory;graphicsSource??=new Uint8Array(memory.length);graphicsLive??=new Uint8Array(pendingGraphics.length);graphicsSource.set(memory);graphicsLive.set(pendingGraphics);const key=nextGraphicsKey(pendingGraphics);if(key!==graphicsKey){graphicsKey=key;graphicsMask=undefined;graphicsRevision++;}drawNativeFullRedrawRaceLayers(memory,pendingGraphics,d,bp,world);});}if(!graphicsSource||!graphicsLive||!renderer.view)return;graphicsMask??=renderGraphicsMask(graphicsSource,graphicsLive,renderer.view.rectangle,renderer.view.fireballMask);return {...renderer.view,mask:graphicsMask,memory:graphicsLive,pixels:rendering!.subarray(0xa0000,0xa0000+64000),revision:graphicsRevision};},
  useDisplay(next:NativeManualRaceDisplay){if(rendering||display||finished)throw Error('A display must be attached before the first manual race frame');display=next;},
  controlReplay(mode:number,first:number,current:number){if(!display||mode!==1)controlReplay(mode,first,current);display?.controlReplay(mode,first,current);},
  drawReplayWait(){if(display){if(!displayRendered)throw Error('Replay seeking requires the retained race framebuffer');display.drawReplayWait();return;}if(!rendering)throw Error('Replay seeking requires the retained race framebuffer');drawOriginalReplayWait(rendering,d);},
  dialogAudio(operation:'pause-audio'|'resume-audio'){return controlNativeAllocatedDialogSound(session.state.memory,d,0x39e1,operation,data.soundDevice);},
  get pixels(){if(display){if(!displayRendered)throw Error('No manual race frame has been rendered');return display.pixels();}if(!rendering)throw Error('No manual race frame has been rendered');return rendering.subarray(0xa0000,0xa0000+64000);},
  tick(devices:AllocatedRaceDevices){if(finished){advanceOriginalHardwareClock(session.state.memory,d);return [] as number[][];}return advanceAllocatedRace(session,audio,devices,{entryStackPointer:bp-0x1c,incomingSI:0});},
  renderWorld(){prepareOriginalRaceViewport(session.state.memory,d,bp);return renderer.render(session.state.memory);},
  renderCockpitWorld(){prepareOriginalRaceViewport(session.state.memory,d,bp);if(display){if(captureGraphics){pendingGraphics.set(session.state.memory);hasPendingGraphics=true;}const pixels=display.render(session.state.memory);displayRendered=true;return pixels;}return renderer.render(session.state.memory,undefined,undefined,undefined,captureGraphics,(memory,world)=>{rendering=memory;if(captureGraphics){graphicsSource??=new Uint8Array(memory.length);graphicsLive??=new Uint8Array(session.state.memory.length);graphicsSource.set(memory);graphicsLive.set(session.state.memory);const key=nextGraphicsKey(session.state.memory);if(key!==graphicsKey){graphicsKey=key;graphicsMask=undefined;graphicsRevision++;}}drawNativeFullRedrawRaceLayers(memory,session.state.memory,d,bp,world);});},
  finishRenderedFrame(){return session.finishRenderedFrame({key:()=>0,controls:()=>0});},
  replayControls(host:Parameters<typeof session.replayControls>[0]){return session.replayControls(host,{entryStackPointer:bp-0x6e});},
  async finish(host:Pick<CompleteRaceExitHost,'gameCounter'|'releaseInput'|'showWaiting'|'copyBackBuffer'|'resetMouse'>&{writeAudio(writes:number[][]):void;opponent:Parameters<typeof session.waitForOpponent>[0]}){
   if(finished)throw Error('Original manual race has already been released');finished=true;
   const emit=(writes:number[][])=>host.writeAudio(writes);
   await finishCompleteNativeRace({...host,memory:()=>session.state.memory,writeMemory:next=>session.originalMemory.writeMemory(next),hasAlternateBuffer:()=>false,hideMouse(){},showMouse(){},selectBackBuffer(){},selectFrontBuffer(){},clearScreen(){},pauseAudio(){emit(audio.produce());},waitForOpponent:()=>session.waitForOpponent(host.opponent,{entryStackPointer:bp-0x1c,afterStep:frame=>emit(dispatchRaceFrameSounds(frame,audio))}),stopEffect(handle){emit(audio.stopEffect(handle));}},d,0x209e0);
  },
  releaseMenuState(){
   if(!finished)throw Error('The original race must finish before restoring its menu');if(released)throw Error('Original saved menu state has already been released');
   const restored=restoreOriginalRaceMenuState(session.state.memory,d);if(restored.error)throw Error('Original manual menu restore failed: '+restored.error);session.originalMemory.writeMemory(restored.memory);released=true;
   const m=session.state.memory;return {retainedSession:readRetainedMenuSession(m,d),configuration:Array.from(m.slice(d+0x8fc2,d+0x8fda)),track:Array.from(m.slice(prepared.trackAddress,prepared.trackAddress+1802)),camera:m[d+0x12f],randomState:Array.from(m.slice(d+0x9f5c,d+0x9f62))};
  },
 };
}
