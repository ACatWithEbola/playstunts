import {nativeMusicScores,type NativeMusicScore} from './native-music-score.ts';
import {createOriginalTandyToneAudio,createOriginalTandyToneStream} from './tandy-tone-audio.ts';
import {createControlledOriginalTandyMusic} from './controlled-tandy-music.ts';
import type {OriginalTandyMusicSeed} from './tandy-music-runtime.ts';
import type {originalMenuAudioControl} from './menu-audio-control.ts';
import {audioBufferBatch} from './audio-buffer-batch.ts';
import {fadeOriginalMusic} from './fade-original-music.ts';
import {cancelAndHoldAudioParam} from './audio-param-automation.ts';

/** Supplied Stunts scores on the Tandy TL tone profile. Retained-CX table
 * choices are audio-equivalent for these verified banks; custom sampled
 * instruments require a separate hardware host. Analog mix is approximate. */
export async function createNativeTandyMusic(context:AudioContext){
 const seeds=await Promise.all(nativeMusicScores.map(async name=>{const response=await fetch('/game/tandy-music-'+name+'-seed.json');if(!response.ok)throw Error('Original Tandy score failed to load');return await response.json() as OriginalTandyMusicSeed;}));
 const options={variant:'pssj3' as const,clockHz:3579545,psgGain:0.5,speakerGain:1};
 const speaker=createOriginalTandyToneAudio(context.sampleRate,options),gain=context.createGain();speaker.write(0x43,0xb6);gain.gain.value=.6;gain.connect(context.destination);
 let runtime:ReturnType<typeof createControlledOriginalTandyMusic>|undefined,stream:ReturnType<typeof createOriginalTandyToneStream>|undefined,next=0,closed=false,timer:ReturnType<typeof setInterval>|undefined,musicEnabled=true,soundEnabled=true,paused=false,generation=0;
 const sources=new Set<AudioBufferSourceNode>();
 const release=(source:AudioBufferSourceNode)=>{source.onended=null;sources.delete(source);try{source.stop();}catch{}source.disconnect();source.buffer=null;};
 const stop=()=>{generation++;clearInterval(timer);for(const source of sources)release(source);runtime=undefined;stream=undefined;next=0;};
 const pump=()=>{if(closed||!stream||context.state!=='running')return;next=audioBufferBatch(next,context.currentTime,512/context.sampleRate,start=>{const buffer=context.createBuffer(1,512,context.sampleRate);buffer.copyToChannel(stream!.render(512),0);const source=context.createBufferSource();source.buffer=buffer;source.connect(gain);sources.add(source);source.onended=()=>release(source);source.start(start);});};
 const write=(writes:number[][])=>{for(const [port,value] of writes)speaker.write(port,value);};
 const control=(operation:Parameters<typeof originalMenuAudioControl>[1])=>{if(runtime){const result=runtime.control(operation,0);if(result.bios.length)throw Error('Unexpected Tandy sample request in supplied music');write(result.writes);musicEnabled=runtime.state.musicEnabled===1;soundEnabled=runtime.state.soundEnabled===1;paused=!!runtime.state.paused;return result.enabled;}if(operation==='toggle-music')musicEnabled=!musicEnabled;else if(operation==='toggle-sound')soundEnabled=!soundEnabled;else paused=operation==='pause-audio';return operation==='toggle-music'?Number(musicEnabled):operation==='toggle-sound'?Number(soundEnabled):0;};
 const setOutputMuted=(muted:boolean,at=context.currentTime,fade=0)=>{if(closed)return;const parameter=gain.gain;cancelAndHoldAudioParam(parameter,at);if(fade>0)parameter.linearRampToValueAtTime(muted?0:.6,at+fade);else parameter.setValueAtTime(muted?0:.6,at);};
 return {control,setOutputMuted,fadeTicks:128,get settings(){return {musicEnabled,soundEnabled,paused};},play(name:NativeMusicScore){if(closed||!musicEnabled)return;const restorePaused=paused,restoreSound=soundEnabled;stop();const seed=seeds[nativeMusicScores.indexOf(name)];runtime=createControlledOriginalTandyMusic(seed);stream=createOriginalTandyToneStream({tick:()=>runtime!.tick(0)},seed.initialWrites,context.sampleRate,options,speaker);if(!restoreSound)control('toggle-sound');if(restorePaused)control('pause-audio');pump();timer=setInterval(pump,25);},
  async fadeOut(waitTicks:(ticks:number)=>Promise<void>){if(closed)return;const owner=++generation,active=()=>!closed&&owner===generation;const memory=new Uint8Array(65536);memory[0x9f62]=127;let delay=0;await fadeOriginalMusic({memory:()=>memory,musicVolume(value){if(active()&&runtime)for(let owner=0;owner<runtime.runtime.state.tracks;owner++){const result=runtime.runtime.control({type:'volume',owner,value},0);if(result.bios.length)throw Error('Unexpected Tandy sample request during fade');write(result.writes);}},alternateCommand(){throw Error('Unexpected alternate music driver');},beginDelay(ticks){delay=ticks;},finishDelay:()=>active()?waitTicks(delay):Promise.resolve(),stopMusic(){if(active())stop();}},0,2);},
  stop,close(){if(closed)return;stop();closed=true;gain.disconnect();void context.close().catch(()=>{});}
 };
}
