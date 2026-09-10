import {createOriginalPcSpeakerMusicRuntime,type OriginalPcSpeakerMusicSeed} from './pc-speaker-music-runtime.ts';
import {originalMenuAudioControl,type OriginalMenuAudioState} from './menu-audio-control.ts';
/** Original menu control operations applied to the running PC-speaker score. */
export function createControlledOriginalPcSpeakerMusic(seed:OriginalPcSpeakerMusicSeed){
 const runtime=createOriginalPcSpeakerMusicRuntime(seed);
 let state:OriginalMenuAudioState={paused:0,guard:0,musicEnabled:1,soundEnabled:1,alternate:0,alternateVolume:100,trackCount:runtime.state.tracks,volumes:runtime.timers.map(t=>t[40]),pausedVolumes:new Array(24).fill(0),soundVolumes:new Array(24).fill(0)};
 return {
  runtime,get state(){return {...state,volumes:runtime.timers.map(t=>t[40])};},
  control(operation:Parameters<typeof originalMenuAudioControl>[1]){const result=originalMenuAudioControl({...state,volumes:runtime.timers.map(t=>t[40])},operation);state=result.state;return {enabled:result.result,writes:result.effects.flatMap(effect=>runtime.control(effect))};},
  tick(){return runtime.tick(state.musicEnabled===1&&!state.paused);},
 };
}
