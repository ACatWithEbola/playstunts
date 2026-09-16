import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
import {createOriginalTandyMusicRuntime,type OriginalTandyMusicSeed} from './tandy-music-runtime.ts';
import {originalMenuAudioControl,type OriginalMenuAudioState} from './menu-audio-control.ts';
/** Original menu control operations applied to the running Tandy score. */
export function createControlledOriginalTandyMusic(seed:OriginalTandyMusicSeed){
 const runtime=createOriginalTandyMusicRuntime(seed);
 let state:OriginalMenuAudioState={paused:0,guard:0,musicEnabled:1,soundEnabled:1,alternate:0,alternateVolume:100,trackCount:runtime.state.tracks,volumes:runtime.timers.map(t=>t[40]),pausedVolumes:Array.from({length:24},()=>0),soundVolumes:Array.from({length:24},()=>0)};
 return {
  runtime,get state(){return {...state,volumes:runtime.timers.map(t=>t[40])};},
  control(operation:Parameters<typeof originalMenuAudioControl>[1],incomingCx:number){const result=originalMenuAudioControl({...state,volumes:runtime.timers.map(t=>t[40])},operation);state=result.state;let cx=incomingCx;const writes:number[][]=[],bios:OriginalTandyBiosSound[]=[];for(const effect of result.effects){const output=runtime.control(effect,cx);cx=output.cx;writes.push(...output.writes);bios.push(...output.bios);}return {enabled:result.result,writes,bios,cx};},
  tick(incomingCx:number){return runtime.tick(incomingCx,state.musicEnabled===1&&!state.paused);},
 };
}
