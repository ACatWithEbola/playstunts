import {createBrowserModernTandyBackend} from '../lib/game/browser-modern-tandy-backend.ts';
import type {NativeRaceSoundDevice} from '../lib/game/native-race-sound-device.ts';
/** Loopback-only experimental audio profile. Reset latch midpoint and mix are
 * explicit QA inputs, not measured vintage hardware/CPU timing. Never default
 * enable or count this profile as full compatibility acceptance. */
export function createBrowserMs91TandyPreview(sampleRate:number,device:NativeRaceSoundDevice|undefined,location:Pick<Location,'hostname'|'search'>|undefined=typeof window==='undefined'?undefined:window.location){
 if(!location||!['localhost','127.0.0.1','[::1]','::1'].includes(location.hostname)||new URLSearchParams(location.search).get('preview-tandy')!=='full')return;
 return createBrowserModernTandyBackend(sampleRate,device);
}
