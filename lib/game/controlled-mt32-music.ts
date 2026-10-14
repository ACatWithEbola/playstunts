import {createOriginalMt32MusicRuntime,type OriginalMt32MusicSeed} from './mt32-music-runtime.ts';
import {originalMenuAudioControl,type OriginalMenuAudioState} from './menu-audio-control.ts';
import type {OriginalMt32MpuProgram} from './mt32-transport.ts';
import type {OriginalMenuAudioEffect} from './menu-audio-control.ts';
export interface TimedMt32MusicHost{execute(program:OriginalMt32MpuProgram):Promise<number>;write(writes:number[][]):void|Promise<void>}
/** Original menu controls use Roland system-volume messages for pause/resume. */
export function createControlledOriginalMt32Music(seed:OriginalMt32MusicSeed){
 const runtime=createOriginalMt32MusicRuntime(seed);
 let timedControls:Promise<unknown>=Promise.resolve(),pendingOperations=0,failedStateDelivery=false;
 const requireHealthy=()=>{if(failedStateDelivery)throw Error('Roland timed music state delivery failed; recreate controller');};
 const enqueue=<T>(operation:()=>Promise<T>)=>{
  pendingOperations++;
  const pending=timedControls.catch(()=>{}).then(()=>{requireHealthy();return operation();}).finally(()=>{pendingOperations--;});
  timedControls=pending;return pending;
 };
 const requireIdle=()=>{requireHealthy();if(pendingOperations)throw Error('Roland timed transport operation is pending');};
 let state:OriginalMenuAudioState={paused:0,guard:0,musicEnabled:1,soundEnabled:1,alternate:1,alternateVolume:100,trackCount:runtime.state.tracks,volumes:runtime.timers.map(t=>t[40]),pausedVolumes:Array.from({length:24},()=>0),soundVolumes:Array.from({length:24},()=>0)};
 const deliverEffect=async(effect:OriginalMenuAudioEffect,host:TimedMt32MusicHost)=>{
  if(effect.type==='master-volume'){
   if(await host.execute(runtime.masterVolumeProgram(effect.value))!==0)throw Error('Roland music volume transport failed');
  }else{
   try{await host.write(runtime.control(effect).writes);}
   catch(error){failedStateDelivery=true;throw error;}
  }
 };
 return {
  runtime,get state(){return {...state,volumes:runtime.timers.map(t=>t[40])};},
  control(operation:Parameters<typeof originalMenuAudioControl>[1]){
   requireIdle();
   const result=originalMenuAudioControl({...state,volumes:runtime.timers.map(t=>t[40])},operation);
   const writes:number[][]=[];for(const effect of result.effects)writes.push(...runtime.control(effect).writes);
   state=result.state;
   return {enabled:result.result,writes};
  },
  /** Timed controls and ticks share one queue. Caller owns cancellation and
   * must not mix synchronous operations with queued delivery. */
  async controlTimed(operation:Parameters<typeof originalMenuAudioControl>[1],host:TimedMt32MusicHost){
   return enqueue(async()=>{
   const result=originalMenuAudioControl({...state,volumes:runtime.timers.map(t=>t[40])},operation);
   for(const effect of result.effects)await deliverEffect(effect,host);
   state=result.state;
   return result.result;
   });
  },
  /** Fade volumes and explicit score-stop effects use the same queue as IRQs. */
  effectTimed(effect:OriginalMenuAudioEffect,host:TimedMt32MusicHost){
   const retained={...effect};
   return enqueue(()=>deliverEffect(retained,host));
  },
  tickTimed(host:{write(writes:number[][]):void|Promise<void>}){
   return enqueue(async()=>{
    try{const result=runtime.tick(state.musicEnabled===1&&!state.paused);await host.write(result.writes);return result;}
    catch(error){failedStateDelivery=true;throw error;}
   });
  },
  tick(){requireIdle();return runtime.tick(state.musicEnabled===1&&!state.paused);},
 };
}
