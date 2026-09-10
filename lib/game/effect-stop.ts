import {adlibReset} from './adlib-release.ts';
import type {EffectRuntimeState} from './effect-runtime.ts';
/** Original 0x29466 with 0x2b4d8 and null-resource 0x29b02 initialization.
 * Regular AdLib melodic channels; sample-channel ownership is not supported.
 */
export function stopEffect(before:EffectRuntimeState&{markers:Uint8Array},handle:number,master:number){
 const timers=before.timers.map(t=>t.slice()),voices=before.voices.map(v=>v.slice()),lastNotes=before.lastNotes.slice(),markers=before.markers.slice(),writes:number[][]=[];
 const result=()=>({...before,timers,voices,lastNotes,markers,writes});
 handle=handle<<16>>16;if(handle<16||handle>23)return result();
 for(let index=0;index<voices.length;index++){
  const record=voices[index];if(record[0]!==handle)continue;
  if(index===0)throw Error('Unreconstructed sample-channel effect stop');
  writes.push(...adlibReset(index-1));record[0]=255;record[1]=0;record[2]=0;
  new DataView(record.buffer).setUint32(16,0,true);
 }
 const timer=timers[handle],v=new DataView(timer.buffer);
 for(const [offset,value] of [[0x22,127],[0x23,handle],[0x16,15],[0x32,0],[4,0],[0x24,0],[0x15,0],[0x1c,0],[0x28,master&255],[0x25,0],[0x29,0],[0x2a,0],[0x2b,0],[0x2c,0],[0x47,255]])timer[offset]=value;
 for(const offset of [0,2,0x18,0x1a,0x1e,0x20,0x26])v.setUint16(offset,0,true);
 lastNotes[handle]=0;markers[handle]=0;
 return result();
}
