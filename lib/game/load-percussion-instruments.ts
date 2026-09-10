import {soundResourceOffset} from './sound-resource.ts';
import type {AudioFarPointer} from './resolve-car-audio.ts';
/** Original29cb8..29d63 shared percussion pointers, in DS destination order. */
export function loadPercussionInstruments(voices:Uint8Array,address:AudioFarPointer):AudioFarPointer[]{
 return ['BASD','SNAR','TOMM','RIDE','CRSH','CHHT','OHHT'].map(name=>{
  const offset=soundResourceOffset(voices,Uint8Array.from(name,c=>c.charCodeAt(0)));
  return offset===null?{offset:0,segment:0}:{offset:(address.offset+offset)&65535,segment:address.segment&65535};
 });
}
