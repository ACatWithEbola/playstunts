import {freeOriginalDisplayWindow} from './allocate-display-window.ts';
import {freeNativeRaceResources} from './free-race-resources.ts';
import {freeOriginalSpriteWindow} from './free-sprite-window.ts';
import {removeOriginalAudioTimer} from './remove-audio-timer.ts';

export interface CompleteRaceResourceCleanupHost {
 memory():Uint8Array;
 writeMemory(memory:Uint8Array):void;
 stopEffect(handle:number):void;
}
/** Original race cleanup with its window allocator and audio callback removal.
 * Only the audio driver's voice stop remains a host operation. */
export function freeCompleteNativeRaceResources(host:CompleteRaceResourceCleanupHost,d:number,graphicsCodeBase:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 freeNativeRaceResources({
  memory:()=>host.memory(),writeMemory:memory=>host.writeMemory(memory),
  freeWindow(offset,segment){
   const result=mode==='mcga'?freeOriginalSpriteWindow(host.memory(),d,graphicsCodeBase,offset,segment):freeOriginalDisplayWindow(host.memory(),d,mode,offset,segment);
   host.writeMemory(result.memory);
   if(result.error)throw Error('Original race window release failed: '+result.error);
  },
  removeAudioTimer(){removeOriginalAudioTimer({memory:()=>host.memory(),stopEffect:handle=>host.stopEffect(handle)},d,mode);},
 },d,mode);
}
