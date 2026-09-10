import {createRaceOverlayMask} from './race-overlay-mask.ts';
import {advanceOriginalHardwareClock} from './hardware-clock-memory.ts';
import {readRetainedMenuSession,type RetainedMenuSession} from './retained-menu-session.ts';
import {drawNativeFullRedrawRaceLayers} from './full-redraw-race-layers.ts';
import {advanceAllocatedRace} from './advance-allocated-race.ts';
import {prepareNativeAllocatedRace} from './native-allocated-race-preparation.ts';
import {analyzeRoute} from '../physics/route-analysis.ts';
import {createNativeRaceSession,type NativeRaceData} from './native-race-session.ts';
import {createNativeAllocatedSound,type NativeRaceSoundDevice} from './native-race-sound-device.ts';
import {prepareOriginalRaceViewport} from './race-viewport.ts';
import {createNativeOriginalRenderer} from './native-original-renderer.ts';
import {restoreOriginalRaceMenuState} from './race-menu-state.ts';
import {finishCompleteNativeRace,type CompleteRaceExitHost} from './complete-race-exit.ts';
import type {createNativeResourceCatalog} from './native-resource-catalog.ts';
export interface NativeDemoData extends Pick<NativeRaceData,'records'|'vectors'|'samples'|'objects'|'points'|'indices'|'planes'|'walls'> {
 soundDevice?:NativeRaceSoundDevice;
 base:Uint8Array;catalog:ReturnType<typeof createNativeResourceCatalog>;
 cars:Array<NativeRaceData['tuning']&{id:string;rawSimulation:string}>;
}
export interface NativeDemoMenuState {configuration:readonly number[];track:readonly number[];name:string;path?:string;camera:number;graphics:number;soundEnabled:boolean;randomState?:readonly number[];retainedSession?:RetainedMenuSession}
/** A native unattended race with real allocation, replay loading and cleanup.
 * The base contains retained original data and an empty resource allocator. */
export async function createNativeDemoRuntime(data:NativeDemoData,menu:NativeDemoMenuState,progress:(stage:number)=>void=()=>{}){
 const d=0x2d1a0,c=0x209e0,bp=0xeefe,driver=0x39e1;
 const prepared=await prepareNativeAllocatedRace(data,menu,true,progress);
 const {memory,raw,trackAddress,initialWrites}=prepared;
 const word=(at:number)=>new DataView(memory.buffer,memory.byteOffset,memory.byteLength).getUint16(d+at,true);
 const bank=word(0x9c40)+word(0x9c42)*16,length=word(0x8fd8),inputs=memory.slice(bank,bank+length),id=String.fromCharCode(...memory.slice(d+0x8fc2,d+0x8fc6)),tuning=data.cars.find(car=>car.id===id);
 if(!tuning)throw Error('Original demo car simulation is missing: '+id);
 const simulation=Uint8Array.from(tuning.rawSimulation.match(/../g)!.map(byte=>parseInt(byte,16)));
 const session=createNativeRaceSession({...data,startup:memory,packedOpponent:new Uint8Array(),simulation,tuning,raw},{opponentSelected:0,replayInputs:inputs,deferSimulationEntry:true,produceAudio:true});
 await session.enterSimulation({resetMouse(){throw Error('Unexpected demo mouse reset');},async key(){throw Error('Unexpected demo replay seek');}},{entryStackPointer:bp-0x1c,incomingSI:0});
 const audio=createNativeAllocatedSound(()=>session.state.memory,d,driver,data.soundDevice),renderer=createNativeOriginalRenderer(session.state.memory,raw,analyzeRoute(raw,data.records,data.vectors,data.samples,data.objects,undefined,{sample:false}),{allocatedResources:true,originalViewport:true,originalCameras:{objects:data.objects,planes:data.planes}});
 let finished=false,captureGraphics=false;let graphicsSource:Uint8Array|undefined,graphicsLive:Uint8Array|undefined,pixels=new Uint8Array(64000);
 return {
  session,audio,initialWrites,length,raw,
  enableGraphicsCapture(){captureGraphics=true;},
  get pixels(){return pixels;},
  graphicsFrame(){if(!graphicsSource||!graphicsLive||!renderer.view)return;return {...renderer.view,mask:createRaceOverlayMask(graphicsSource,graphicsLive,renderer.view.rectangle,renderer.view.fireballMask),memory:graphicsLive,pixels};},
  get frame(){const m=session.state.memory;return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(d+0x8c26,true);},
  tick(){
   if(finished){advanceOriginalHardwareClock(session.state.memory,d);return [] as number[][];}
   return advanceAllocatedRace(session,audio,{mouse(){throw Error('Demo requested mouse input');},joystickSteering(){throw Error('Demo requested joystick steering');},controls(){throw Error('Demo requested driving input');},keyDown(){throw Error('Demo requested key scans');}},{entryStackPointer:bp-0x1c,incomingSI:0});
  },
  render(presentationOnly=false){const live=presentationOnly?session.state.memory.slice():session.state.memory;prepareOriginalRaceViewport(live,d,bp);if(presentationOnly)live[d+0x9ab6]=1;pixels=renderer.render(live,undefined,undefined,undefined,captureGraphics,(memory,world)=>{if(captureGraphics){graphicsSource??=new Uint8Array(memory.length);graphicsLive??=new Uint8Array(session.state.memory.length);graphicsSource.set(memory);graphicsLive.set(live);}drawNativeFullRedrawRaceLayers(memory,live,d,bp,world);});return pixels;},
  finishFrame(key:number,controls:number){return session.finishRenderedFrame({key:()=>key,controls:()=>controls});},
  async finish(host:Pick<CompleteRaceExitHost,'gameCounter'|'releaseInput'|'showWaiting'|'copyBackBuffer'|'resetMouse'>&{writeAudio(writes:number[][]):void}){
   if(finished)throw Error('Original demo has already been released');finished=true;
   const writes:number[][]=[],emit=(next:number[][])=>{writes.push(...next);host.writeAudio(next);};
   await finishCompleteNativeRace({...host,memory:()=>session.state.memory,writeMemory:next=>session.originalMemory.writeMemory(next),hasAlternateBuffer:()=>false,hideMouse(){},showMouse(){},selectBackBuffer(){},selectFrontBuffer(){},clearScreen(){},pauseAudio(){emit(audio.produce());},async waitForOpponent(){},stopEffect(handle){emit(audio.stopEffect(handle));}},d,c);
   const restored=restoreOriginalRaceMenuState(session.state.memory,d);if(restored.error)throw Error('Original demo restore failed: '+restored.error);session.originalMemory.writeMemory(restored.memory);
   const m=session.state.memory;return {writes,retainedSession:readRetainedMenuSession(m,d),configuration:Array.from(m.slice(d+0x8fc2,d+0x8fda)),track:Array.from(m.slice(trackAddress,trackAddress+1802)),camera:m[d+0x12f],randomState:Array.from(m.slice(d+0x9f5c,d+0x9f62))};
  },
 };
}
