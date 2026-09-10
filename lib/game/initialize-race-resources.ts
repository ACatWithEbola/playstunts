import {prepareOriginalCockpitDisplayResources} from './prepare-cockpit-display-resources.ts';
import type {OriginalCockpitDisplayDrawingHost} from './cockpit-display-host.ts';
import {allocateOriginalDisplayWindow} from './allocate-display-window.ts';
import {prepareNativeRaceCars} from './prepare-race-cars.ts';
import {loadNativeResource,type NativeResourceFileHost} from './load-native-resource.ts';
import {initializeOriginalAudioTimer} from './initialize-audio-timer.ts';
import {allocateOriginalCarAudioMemory} from './allocate-car-audio-memory.ts';
import {initializeOriginalRaceScreenRegions} from './initialize-race-screen-regions.ts';
import {prepareNativeCockpitResources} from './prepare-cockpit-resources.ts';
import {initializeOriginalReplayResources} from './replay-resource-initialization.ts';
import {loadCompleteNativeGameResource} from './load-complete-game-resource.ts';
import {findOriginalResource} from './find-original-resource.ts';
import {initializeOriginalRaceSprites} from './load-race-sprites.ts';
import {loadNativeRaceHorizon} from './load-race-horizon.ts';
import {loadNativeSceneShapes,originalAvailableResourceBytes} from './load-scene-shapes.ts';
import {allocateOriginalSpriteWindow} from './allocate-sprite-window.ts';
export interface NativeRaceResourceHost extends NativeResourceFileHost {progress(stage:number):void;prepareOpponent?(framePointer:number):void|Promise<void>}
/** Original1543E resource startup. The caller supplies valid allocator/graphics,
 * track and resistance-table storage; no stripped startup snapshot is assumed. */
export async function initializeNativeRaceResources(host:NativeRaceResourceHost,d:number,framePointer:number,display?:{mode:'cga'|'tandy'|'ega';drawing:OriginalCockpitDisplayDrawingHost}){
 const mode=display?.mode??'mcga',high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode],middle=mode==='ega'?0x460:high;
 const u=(n:number)=>n&65535,word=(at:number)=>{const m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(d+u(at),true);};
 const set=(at:number,value:number)=>{const m=host.memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+u(at),u(value),true);};
 const save=(at:number,pointer:{offset:number;segment:number})=>{set(at,pointer.offset);set(at+2,pointer.segment);};
 const required=(pointer:{offset:number;segment:number}|null)=>{if(!pointer)throw Error('Original race startup requires the canceled resource');return pointer;};
 const load=async(kind:number,name:number,bp=u(framePointer-0x12))=>required(await loadNativeResource(host,d,kind,name,bp,mode));
 const span=(at:number)=>{
  const offset=word(at),segment=word(at+2),first=word(0x4b12);let descriptor=word(0x4b14);
  for(let guard=0;;guard++){
   if(descriptor===first)throw Error('Original audio allocation is missing');
   if(word(descriptor+14)===segment)return {offset,segment,length:word(descriptor+12)*16};
   if(guard>=3641)throw Error('Original audio allocation chain is not bounded');descriptor=u(descriptor-18);
  }
 };
 await prepareNativeRaceCars(host,d,framePointer,mode);host.progress(3);
 save(0x9ab8+high,await load(5,0x3133));save(0xa41e+high,await load(6,0x3138));
 initializeOriginalAudioTimer(host.memory(),d,mode);
 const allocateAudio=(descriptor:number)=>allocateOriginalCarAudioMemory(host.memory(),d,{offset:descriptor,segment:d/16},span(0xa41e+high),span(0x9ab8+high),mode);
 set(0x8016+high,allocateAudio(0x300c));for(const at of [0x9fea+high,0x73d8+middle,0x73dc+middle])host.memory()[d+at]=0;
 if(host.memory()[d+0x8fc8+high])set(0x86de+high,allocateAudio(0x303c));
 for(const at of [0x9332+high,0x8ffc+high,0x8a46+high])set(at,0);
 save(0xa006+high,await load(0,0x313c));initializeOriginalRaceScreenRegions(host.memory(),d,mode);
 if(!host.memory()[d+0x90f8+high]){
  const cockpit={...host,loadBank:(kind:number,name:number)=>load(kind,name,u(framePointer-0x3e))};
  if(display)await prepareOriginalCockpitDisplayResources(cockpit,d,display.mode,display.drawing);else await prepareNativeCockpitResources(cockpit,d);
 }
 if(!host.memory()[d+0x90f8+high]){save(0xa318+high,await load(3,0x3148));initializeOriginalReplayResources(host.memory(),d,mode);}
 const game=await loadCompleteNativeGameResource(host,d,0x314f,u(framePointer-0x10));save(0x8fbe+high,game);
 save(0x9ad6+high,findOriginalResource(host.memory(),d,game.offset,game.segment,0x3154,true)!);
 save(0xaa70+high,findOriginalResource(host.memory(),d,game.offset,game.segment,0x3159,true)!);
 const sprites=await load(8,0x96b,u(framePointer-0x1e));initializeOriginalRaceSprites(host.memory(),d,sprites,mode);
 const horizon=host.memory()[word(0x9358+high)*16+u(word(0x9356+high)+900)];
 await loadNativeRaceHorizon({memory:()=>host.memory(),writeMemory:m=>host.writeMemory(m),exists:at=>host.exists(at),async read(at){const bytes=await host.readFile(at,true);if(!bytes)throw Error('Original required horizon file is missing');return bytes;}},d,horizon,u(framePointer-0x10),mode);
 if(await loadNativeSceneShapes(host,d,u(framePointer-0xe),mode))return 1;
 if(!host.memory()[d+0xaa46+high]){
  const divisor=(word(0x90fa+high)*word(0xa7e0+high)<<16)>>16;if(!divisor)throw Error('Original race window size division fault');
  const requiredBytes=Math.trunc(64000/divisor)+18;if(originalAvailableResourceBytes(host.memory(),d)<=requiredBytes)return 1;
  const window=display?allocateOriginalDisplayWindow(host.memory(),d,display.mode,320,200):allocateOriginalSpriteWindow(host.memory(),d,320,200);host.writeMemory(window.memory);
  if(window.error||!window.window)throw Error('Original race window allocation failed: '+window.error);save(0x933a+high,window.window);
 }
 host.memory()[d+0xa9f0+high]=0;host.memory()[d+0x9c46+high]=255;return 0;
}
