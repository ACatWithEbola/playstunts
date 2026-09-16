import {nativeMusicScores,type NativeMusicScore} from './native-music-score.ts';
import {createOriginalPcSpeakerAudio,createOriginalPcSpeakerMusicStream} from './pc-speaker-audio.ts';
import {createControlledOriginalPcSpeakerMusic} from './controlled-pc-speaker-music.ts';
import type {OriginalPcSpeakerMusicSeed} from './pc-speaker-music-runtime.ts';
import type {originalMenuAudioControl} from './menu-audio-control.ts';
import {audioBufferBatch} from './audio-buffer-batch.ts';
import {fadeOriginalMusic} from './fade-original-music.ts';
import {cancelAndHoldAudioParam} from './audio-param-automation.ts';
/** Native PC15 score streaming. Kept separate until setup and race-device
 * selection can use one consistent PC-speaker backend throughout the game. */
export async function createNativePcSpeakerMusic(context:AudioContext){
 const seeds=await Promise.all(nativeMusicScores.map(async name=>{const response=await fetch('/game/pc-music-'+name+'-seed.json');if(!response.ok)throw Error('Original PC-speaker score failed to load');return await response.json() as OriginalPcSpeakerMusicSeed;}));
 const speaker=createOriginalPcSpeakerAudio(context.sampleRate),gain=context.createGain();speaker.write(0x43,0xb6);gain.gain.value=.6;gain.connect(context.destination);
 let runtime:ReturnType<typeof createControlledOriginalPcSpeakerMusic>|undefined,stream:ReturnType<typeof createOriginalPcSpeakerMusicStream>|undefined,next=0,closed=false,timer:ReturnType<typeof setInterval>|undefined,musicEnabled=true,soundEnabled=true,paused=false,generation=0;
 const sources=new Set<AudioBufferSourceNode>();
 const release=(source:AudioBufferSourceNode)=>{source.onended=null;sources.delete(source);try{source.stop();}catch{}source.disconnect();source.buffer=null;};
 const stop=()=>{generation++;clearInterval(timer);for(const source of sources)release(source);runtime=undefined;stream=undefined;next=0;};
 const pump=()=>{if(closed||!stream||context.state!=='running')return;next=audioBufferBatch(next,context.currentTime,512/context.sampleRate,start=>{const buffer=context.createBuffer(1,512,context.sampleRate);buffer.copyToChannel(stream!.render(512),0);const source=context.createBufferSource();source.buffer=buffer;source.connect(gain);sources.add(source);source.onended=()=>release(source);source.start(start);});};
 const write=(writes:number[][])=>{for(const [port,value] of writes)speaker.write(port,value);};
 const control=(operation:Parameters<typeof originalMenuAudioControl>[1])=>{if(runtime){const result=runtime.control(operation);write(result.writes);musicEnabled=runtime.state.musicEnabled===1;soundEnabled=runtime.state.soundEnabled===1;paused=!!runtime.state.paused;return result.enabled;}if(operation==='toggle-music')musicEnabled=!musicEnabled;else if(operation==='toggle-sound')soundEnabled=!soundEnabled;else paused=operation==='pause-audio';return operation==='toggle-music'?Number(musicEnabled):operation==='toggle-sound'?Number(soundEnabled):0;};
 const setOutputMuted=(muted:boolean,at=context.currentTime,fade=0)=>{if(closed)return;const parameter=gain.gain;cancelAndHoldAudioParam(parameter,at);if(fade>0)parameter.linearRampToValueAtTime(muted?0:.6,at+fade);else parameter.setValueAtTime(muted?0:.6,at);};
 return {control,setOutputMuted,fadeTicks:128,get settings(){return {musicEnabled,soundEnabled,paused};},play(name:NativeMusicScore){if(closed||!musicEnabled)return;const restorePaused=paused,restoreSound=soundEnabled;stop();const seed=seeds[nativeMusicScores.indexOf(name)];runtime=createControlledOriginalPcSpeakerMusic(seed);stream=createOriginalPcSpeakerMusicStream(runtime,seed.initialWrites,context.sampleRate,speaker);if(!restoreSound)control('toggle-sound');if(restorePaused)control('pause-audio');pump();timer=setInterval(pump,25);},
  async fadeOut(waitTicks:(ticks:number)=>Promise<void>){if(closed)return;const owner=++generation,active=()=>!closed&&owner===generation;const memory=new Uint8Array(65536);memory[0x9f62]=127;let delay=0;await fadeOriginalMusic({memory:()=>memory,musicVolume(value){if(active()&&runtime)for(let owner=0;owner<runtime.runtime.state.tracks;owner++)write(runtime.runtime.control({type:'volume',owner,value}));},alternateCommand(){throw Error('Unexpected alternate music driver');},beginDelay(ticks){delay=ticks;},finishDelay:()=>active()?waitTicks(delay):Promise.resolve(),stopMusic(){if(active())stop();}},0,2);},
  stop,close(){if(closed)return;stop();closed=true;gain.disconnect();void context.close().catch(()=>{});}
 };
}
