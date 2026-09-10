import {adlibReset} from './adlib-release.ts';
import type {EffectRuntimeState} from './effect-runtime.ts';
/** Original 0x29e86, captured regular AdLib with no active sample IRQ. */
export function resetAudio<T extends EffectRuntimeState&{markers:Uint8Array;paused:number}>(before:T){
 const timers=before.timers.map(t=>t.slice()),voices=before.voices.map(v=>v.slice()),lastNotes=before.lastNotes.slice(),markers=before.markers.slice(),writes:number[][]=[];
 for(let owner=0;owner<24;owner++){
  const t=timers[owner],v=new DataView(t.buffer);
  for(const [o,x] of [[0x22,127],[0x23,owner],[0x16,15],[0x32,0],[4,0],[0x24,0],[0x15,0],[0x1c,0],[0x28,127],[0x25,0],[0x29,0],[0x2a,0],[0x2b,0],[0x2c,0],[0x47,255]])t[o]=x;
  for(const o of [0,2,0x18,0x1a,0x1e,0x20,0x26])v.setUint16(o,0,true);
  lastNotes[owner]=0;markers[owner]=0;
 }
 for(let index=0;index<voices.length;index++){
  writes.push(...(index===0?[[0xb0,1]]:adlibReset(index-1)));
  const v=voices[index];v[0]=255;v[1]=0;v[2]=0;v[44]=255;new DataView(v.buffer).setUint32(16,0,true);
 }
 for(let channel=0;channel<9;channel++)writes.push(...adlibReset(channel));
 writes.push([0xb0,1]);
 return {...before,timers,voices,lastNotes,markers,paused:0,writes};
}
