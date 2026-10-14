import {freeOriginalDisplayWindow} from './allocate-display-window.ts';
import {freeNativeRaceResources,freeNativeRaceResourcesAsync} from './free-race-resources.ts';
import {freeOriginalSpriteWindow} from './free-sprite-window.ts';
import {removeOriginalAudioTimer,removeOriginalAudioTimerAsync} from './remove-audio-timer.ts';

export interface CompleteRaceResourceCleanupHost {
 memory():Uint8Array;
 writeMemory(memory:Uint8Array):void;
 stopEffect(handle:number):void;
}
/** Original race cleanup with its window allocator and audio callback removal.
 * Only the audio driver's voice stop remains a host operation. */
function resourceHost(host:Pick<CompleteRaceResourceCleanupHost,'memory'|'writeMemory'>,d:number,graphicsCodeBase:number,mode:'mcga'|'cga'|'tandy'|'ega'){
 return {
  memory:()=>host.memory(),writeMemory:(memory:Uint8Array)=>host.writeMemory(memory),
  freeWindow(offset:number,segment:number){
   const result=mode==='mcga'?freeOriginalSpriteWindow(host.memory(),d,graphicsCodeBase,offset,segment):freeOriginalDisplayWindow(host.memory(),d,mode,offset,segment);
   host.writeMemory(result.memory);
   if(result.error)throw Error('Original race window release failed: '+result.error);
  },
 };
}
export function freeCompleteNativeRaceResources(host:CompleteRaceResourceCleanupHost,d:number,graphicsCodeBase:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 freeNativeRaceResources({...resourceHost(host,d,graphicsCodeBase,mode),removeAudioTimer:()=>removeOriginalAudioTimer(host,d,mode)},d,mode);
}
export async function freeCompleteNativeRaceResourcesAsync(host:Pick<CompleteRaceResourceCleanupHost,'memory'|'writeMemory'>&{stopEffect(handle:number):void|Promise<void>},d:number,graphicsCodeBase:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 await freeNativeRaceResourcesAsync({...resourceHost(host,d,graphicsCodeBase,mode),removeAudioTimer:()=>removeOriginalAudioTimerAsync(host,d,mode)},d,mode);
}
