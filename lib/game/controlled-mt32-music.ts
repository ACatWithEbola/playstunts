import {createOriginalMt32MusicRuntime,type OriginalMt32MusicSeed} from './mt32-music-runtime.ts';
import {originalMenuAudioControl,type OriginalMenuAudioState} from './menu-audio-control.ts';
/** Original menu controls use Roland system-volume messages for pause/resume. */
export function createControlledOriginalMt32Music(seed:OriginalMt32MusicSeed){
 const runtime=createOriginalMt32MusicRuntime(seed);
 let state:OriginalMenuAudioState={paused:0,guard:0,musicEnabled:1,soundEnabled:1,alternate:1,alternateVolume:100,trackCount:runtime.state.tracks,volumes:runtime.timers.map(t=>t[40]),pausedVolumes:Array.from({length:24},()=>0),soundVolumes:Array.from({length:24},()=>0)};
 return {
  runtime,get state(){return {...state,volumes:runtime.timers.map(t=>t[40])};},
  control(operation:Parameters<typeof originalMenuAudioControl>[1]){
   const result=originalMenuAudioControl({...state,volumes:runtime.timers.map(t=>t[40])},operation);state=result.state;
   const writes:number[][]=[];for(const effect of result.effects)writes.push(...runtime.control(effect).writes);
   return {enabled:result.result,writes};
  },
  tick(){return runtime.tick(state.musicEnabled===1&&!state.paused);},
 };
}
