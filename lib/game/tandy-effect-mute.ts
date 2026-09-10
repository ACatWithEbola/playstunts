import {setOriginalTandyVolume} from './tandy-control.ts';
import type {OriginalTandyEffectState} from './tandy-effect-runtime.ts';
export interface OriginalTandyEffectMuteState extends OriginalTandyEffectState {enabled:number;savedVolumes:Uint8Array}
/** Original effect mute/unmute 0x294e6/0x294b2, TD15 mode.
 * This changes logical gains while leaving sequencing and voice state intact.
 */
export function setOriginalTandyEffectsEnabled(before:OriginalTandyEffectMuteState,enabled:boolean){
 const driver=before.driver.slice();
 const timers=before.timers.map(t=>t.slice()),savedVolumes=before.savedVolumes.slice(),writes:number[][]=[];
 if(enabled?before.enabled===1:before.enabled===0)return {...before,driver,timers,savedVolumes,writes};
 for(let owner=16;owner<24;owner++){
  if(!enabled)savedVolumes[owner]=timers[owner][0x28];
  const volume=enabled?savedVolumes[owner]:0;timers[owner][0x28]=volume;
  for(let index=0;index<before.voices.length;index++){
   const record=before.voices[index];if(record[0]!==owner)continue;
   setOriginalTandyVolume(driver,index,volume);
  }
 }
 return {...before,driver,timers,savedVolumes,enabled:enabled?1:0,writes};
}
