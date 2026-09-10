import {adlibVolume} from './adlib-volume.ts';
import type {EffectRuntimeState} from './effect-runtime.ts';
export interface EffectMuteState extends EffectRuntimeState {enabled:number;savedVolumes:Uint8Array}
/** Original effect mute/unmute 0x294e6/0x294b2, regular AdLib mode.
 * This changes logical gains while leaving sequencing and voice state intact.
 */
export function setEffectsEnabled(before:EffectMuteState,enabled:boolean,instrumentAt:(offset:number,segment:number)=>Uint8Array){
 const timers=before.timers.map(t=>t.slice()),savedVolumes=before.savedVolumes.slice(),writes:number[][]=[];
 if(enabled?before.enabled===1:before.enabled===0)return {...before,timers,savedVolumes,writes};
 for(let owner=16;owner<24;owner++){
  if(!enabled)savedVolumes[owner]=timers[owner][0x28];
  const volume=enabled?savedVolumes[owner]:0;timers[owner][0x28]=volume;
  for(let index=1;index<before.voices.length;index++){
   const record=before.voices[index];if(record[0]!==owner)continue;
   const v=new DataView(record.buffer,record.byteOffset,record.byteLength);
   const instrument=instrumentAt(v.getUint16(16,true),v.getUint16(18,true));
   writes.push(...adlibVolume(Array.from(instrument),index-1,volume,before.velocities[index-1]));
  }
 }
 return {...before,timers,savedVolumes,enabled:enabled?1:0,writes};
}
