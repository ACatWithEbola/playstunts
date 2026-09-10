import {enterNativeRace,type NativeRaceEntryHost} from './native-race-entry.ts';
import {initializeNativeRaceResources,type NativeRaceResourceHost} from './initialize-race-resources.ts';
import {freeCompleteNativeRaceResources} from './complete-race-resource-cleanup.ts';
export interface CompleteRaceEntryHost extends NativeRaceResourceHost,Omit<NativeRaceEntryHost,'initializeResources'|'freeResources'> {
 stopEffect(handle:number):void;
}
/** Original race entry joined to resource startup and its failure cleanup.
 * Resource startup is called with the original nested stack frame, not the
 * top-level race frame used by stand-alone resource-loader callers. */
export function enterCompleteNativeRace(host:CompleteRaceEntryHost,d:number,graphicsCodeBase:number,framePointer:number){
 return enterNativeRace({...host,
  initializeResources:()=>initializeNativeRaceResources(host,d,(framePointer-0x1e)&65535),
  freeResources:()=>freeCompleteNativeRaceResources(host,d,graphicsCodeBase),
 },d,framePointer);
}
