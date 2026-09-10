import type {NativeMusicScore} from './native-music-score.ts';
import {createControlledOriginalMt32Music} from './controlled-mt32-music.ts';
import type {OriginalMt32MusicSeed} from './mt32-music-runtime.ts';
import type {OriginalMenuAudioEffect,originalMenuAudioControl} from './menu-audio-control.ts';
import {createBrowserMt32RaceAudio} from './browser-mt32-race-audio.ts';
import type {Mt32StereoOutput} from './mt32-audio-stream.ts';
import {fadeOriginalMusic} from './fade-original-music.ts';
/** Caller supplies an initialized, patched device and owns its lifetime.
 * Music releases its stream before the race takes over the same synthesizer. */
export function createNativeMt32Music(context:AudioContext,output:Mt32StereoOutput,seeds:Record<NativeMusicScore,OriginalMt32MusicSeed>){
 let runtime:ReturnType<typeof createControlledOriginalMt32Music>|undefined;
 let audio:ReturnType<typeof createBrowserMt32RaceAudio>|undefined,timer:ReturnType<typeof setInterval>|undefined,closed=false;
 let musicEnabled=true,soundEnabled=true,paused=false,generation=0;
 const effect=(value:OriginalMenuAudioEffect)=>{if(runtime)output.write(runtime.runtime.control(value).writes);};
 const stop=()=>{generation++;clearInterval(timer);if(runtime)effect({type:'stop-tracks',first:0,last:runtime.runtime.state.tracks-1});audio?.close();audio=undefined;runtime=undefined;};
 const control=(operation:Parameters<typeof originalMenuAudioControl>[1])=>{
  if(runtime){const result=runtime.control(operation);output.write(result.writes);musicEnabled=runtime.state.musicEnabled===1;soundEnabled=runtime.state.soundEnabled===1;paused=!!runtime.state.paused;return result.enabled;}
  if(operation==='toggle-music')musicEnabled=!musicEnabled;else if(operation==='toggle-sound')soundEnabled=!soundEnabled;else paused=operation==='pause-audio';
  return operation==='toggle-music'?Number(musicEnabled):operation==='toggle-sound'?Number(soundEnabled):0;
 };
 return {control,get settings(){return {musicEnabled,soundEnabled,paused};},
  play(name:NativeMusicScore){
   if(closed||!musicEnabled)return;const restorePaused=paused,restoreSound=soundEnabled;stop();runtime=createControlledOriginalMt32Music(seeds[name]);
   audio=createBrowserMt32RaceAudio(context,output,seeds[name].initialWrites,()=>runtime?.tick().writes??[]);
   if(!restoreSound)control('toggle-sound');if(restorePaused)control('pause-audio');audio.pump();timer=setInterval(()=>audio?.pump(),25);
  },
  async fadeOut(waitTicks:(ticks:number)=>Promise<void>){
   if(closed)return;let owner=++generation;const active=()=>!closed&&owner===generation;const memory=new Uint8Array(65536);memory[0x4e06]=1;let delay=0;
   // Retain the original driver for the final volume restore after stop().
   const fading=runtime?.runtime;
   await fadeOriginalMusic({memory:()=>memory,musicVolume(){throw Error('Unexpected non-Roland fade');},alternateCommand(){if(active()&&fading)output.write(fading.control({type:'master-volume',value:memory[0x4e0b]}).writes);},beginDelay(ticks){delay=ticks;},finishDelay:()=>active()?waitTicks(delay):Promise.resolve(),stopMusic(){if(active()){stop();owner=generation;}}},0,2);
  },stop,close(){if(closed)return;stop();closed=true;},
 };
}
