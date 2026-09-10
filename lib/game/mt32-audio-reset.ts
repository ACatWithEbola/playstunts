import {applyOriginalMt32DriverControl} from './mt32-driver-control.ts';
import type {OriginalMt32EffectState} from './mt32-effect-runtime.ts';
/** Original 0x29e86, MT15 retained state and timer restoration. */
export function resetOriginalMt32Audio<T extends OriginalMt32EffectState&{markers:Uint8Array;paused:number}>(before:T){
 const driver=before.driver.slice();
 const timers=before.timers.map(t=>t.slice()),voices=before.voices.map(v=>v.slice()),lastNotes=before.lastNotes.slice(),markers=before.markers.slice(),writes:number[][]=[];
 for(let owner=0;owner<24;owner++){
  const t=timers[owner],v=new DataView(t.buffer);
  for(const [o,x] of [[0x22,127],[0x23,owner],[0x16,15],[0x32,0],[4,0],[0x24,0],[0x15,0],[0x1c,0],[0x28,127],[0x25,0],[0x29,0],[0x2a,0],[0x2b,0],[0x2c,0],[0x47,255]])t[o]=x;
  for(const o of [0,2,0x18,0x1a,0x1e,0x20,0x26])v.setUint16(o,0,true);
  lastNotes[owner]=0;markers[owner]=0;
 }
 for(let index=0;index<voices.length;index++){
  writes.push(...applyOriginalMt32DriverControl('stop',index,new Uint8Array(46),new Uint8Array(100)).writes);
  const v=voices[index];v[0]=255;v[1]=0;v[2]=0;v[44]=255;new DataView(v.buffer).setUint32(16,0,true);
 }
 for(const kind of ['reset-controllers','silence'] as const)writes.push(...applyOriginalMt32DriverControl(kind,0,new Uint8Array(46),new Uint8Array(100)).writes);
 return {...before,driver,timers,voices,lastNotes,markers,paused:0,writes};
}
