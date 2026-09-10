import {loadSoundEffect} from './load-sound-effect.ts';
import type {AudioFarPointer} from './resolve-car-audio.ts';
/** Compatibility entry point for callers that do not own shared percussion state. */
export function loadEffectHeader(before:Uint8Array,voices:Uint8Array,name:Uint8Array,bankAddress:AudioFarPointer,voiceAddress:AudioFarPointer){
 const {bank,header}=loadSoundEffect(before,voices,name,bankAddress,voiceAddress,[]);
 return {bank,header};
}
