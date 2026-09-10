import {applyOriginalMt32DriverControl} from './mt32-driver-control.ts';
import type {OriginalMt32EffectState} from './mt32-effect-runtime.ts';
export interface OriginalMt32EffectMuteState extends OriginalMt32EffectState {enabled:number;savedVolumes:Uint8Array}
/** Original effect mute/unmute 0x294e6/0x294b2, MT15 mode.
 * This changes logical gains while leaving sequencing and voice state intact.
 */
export function setOriginalMt32EffectsEnabled(before:OriginalMt32EffectMuteState,enabled:boolean){
 const driver=before.driver.slice();
 const timers=before.timers.map(t=>t.slice()),savedVolumes=before.savedVolumes.slice(),writes:number[][]=[];
 if(enabled?before.enabled===1:before.enabled===0)return {...before,driver,timers,savedVolumes,writes};
 for(let owner=16;owner<24;owner++){
  if(!enabled)savedVolumes[owner]=timers[owner][0x28];
  const volume=enabled?savedVolumes[owner]:0;timers[owner][0x28]=volume;
  writes.push(...applyOriginalMt32DriverControl('volume',timers[owner][0x47],new Uint8Array(46),new Uint8Array(100),volume).writes);
 }
 return {...before,driver,timers,savedVolumes,enabled:enabled?1:0,writes};
}
