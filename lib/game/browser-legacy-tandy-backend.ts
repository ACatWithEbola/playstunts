import {createBrowserLegacyTandyVirtualBackend} from './browser-legacy-tandy-virtual-backend.ts';
import type {NativeRaceSoundDevice} from './native-race-sound-device.ts';
/** Defined virtual device; selected by retained sound-driver identity,
 * independent of replay physics. Untagged drivers retain legacy behavior. */
export function createBrowserLegacyTandyBackend(sampleRate:number,device:NativeRaceSoundDevice|undefined){
 if(device?.kind!=='tandy'||(device.driverGeneration??'ms-1990')!=='ms-1990')return;
 return createBrowserLegacyTandyVirtualBackend(sampleRate);
}
