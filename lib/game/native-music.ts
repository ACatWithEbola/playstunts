import {nativeMusicScores,type NativeMusicScore} from './native-music-score.ts';
import {createOriginalOplChip} from './native-audio.ts';
import type {OriginalMusicSeed} from './music-runtime.ts';
import {createControlledOriginalMusic} from './controlled-music-runtime.ts';
import type {originalMenuAudioControl} from './menu-audio-control.ts';
import {createOplOutput} from './opl-output.ts';
import {audioTimerSampleOffsets} from './audio-sample-clock.ts';
import {audioBufferBatch} from './audio-buffer-batch.ts';
import {fadeOriginalMusic} from './fade-original-music.ts';
import {cancelAndHoldAudioParam} from './audio-param-automation.ts';
/** Bounded streaming of the reconstructed original score, without recording or MIDI conversion. */
export async function createNativeMusic(context:AudioContext){
 const seeds=await Promise.all(nativeMusicScores.map(async name=>{const r=await fetch('/game/music-'+name+'-seed.json');if(!r.ok)throw Error('Original score failed to load');return await r.json() as OriginalMusicSeed;}));
 const chip=await createOriginalOplChip(context),output=createOplOutput(chip),gain=context.createGain();gain.gain.value=.6;gain.connect(context.destination);

 let runtime:ReturnType<typeof createControlledOriginalMusic>|undefined,phase=0,next=0,closed=false,timer:ReturnType<typeof setInterval>|undefined;
 let musicEnabled=true,soundEnabled=true,paused=false,generation=0;
 const sources=new Set<AudioBufferSourceNode>();
 const release=(source:AudioBufferSourceNode)=>{source.onended=null;sources.delete(source);try{source.stop();}catch{}source.disconnect();source.buffer=null;};
 const stop=()=>{generation++;clearInterval(timer);for(const s of sources)release(s);runtime=undefined;next=0;};
 const pump=()=>{if(closed||!runtime||context.state!=='running')return;next=audioBufferBatch(next,context.currentTime,512/context.sampleRate,start=>{
  const samples=new Int16Array(1024),clock=audioTimerSampleOffsets(phase,512,context.sampleRate);phase=clock.phase;let position=0;
  const generate=(end:number)=>{if(end>position){output.generate(end-position);samples.set(output.getBuffer().subarray(0,(end-position)*2),position*2);position=end;}};
  for(const offset of clock.offsets){generate(offset);for(const [reg,value] of runtime!.tick())output.write(reg,value);}generate(512);
  const buffer=context.createBuffer(2,512,context.sampleRate);for(let c=0;c<2;c++){const dst=buffer.getChannelData(c);for(let i=0;i<512;i++)dst[i]=samples[i*2+c]/32768;}
  const source=context.createBufferSource();source.buffer=buffer;source.connect(gain);sources.add(source);source.onended=()=>release(source);source.start(start);
 });};
 const control=(operation:Parameters<typeof originalMenuAudioControl>[1])=>{
  if(runtime){const result=runtime.control(operation);for(const [reg,value] of result.writes)output.write(reg,value);musicEnabled=runtime.state.musicEnabled===1;soundEnabled=runtime.state.soundEnabled===1;paused=!!runtime.state.paused;return result.enabled;}
  if(operation==='toggle-music')musicEnabled=!musicEnabled;else if(operation==='toggle-sound')soundEnabled=!soundEnabled;else paused=operation==='pause-audio';
  return operation==='toggle-music'?Number(musicEnabled):operation==='toggle-sound'?Number(soundEnabled):0;
 };
 const setOutputMuted=(muted:boolean,at=context.currentTime,fade=0)=>{if(closed)return;const parameter=gain.gain;cancelAndHoldAudioParam(parameter,at);if(fade>0)parameter.linearRampToValueAtTime(muted?0:.6,at+fade);else parameter.setValueAtTime(muted?0:.6,at);};
 return {control,setOutputMuted,fadeTicks:128,get settings(){return {musicEnabled,soundEnabled,paused};},play(name:NativeMusicScore){if(closed||!musicEnabled)return;const restorePaused=paused,restoreSound=soundEnabled;stop();const seed=seeds[nativeMusicScores.indexOf(name)];runtime=createControlledOriginalMusic(seed);phase=0;for(const [reg,value] of seed.initialWrites)output.write(reg,value);if(!restoreSound)control('toggle-sound');if(restorePaused)control('pause-audio');pump();timer=setInterval(pump,25);},
  async fadeOut(waitTicks:(ticks:number)=>Promise<void>){
   if(closed)return;const owner=++generation,active=()=>!closed&&owner===generation;const memory=new Uint8Array(65536);memory[0x9f62]=127;let delay=0;
   await fadeOriginalMusic({memory:()=>memory,musicVolume(value){if(active()&&runtime)for(let owner=0;owner<runtime.runtime.state.tracks;owner++)for(const [reg,n] of runtime.runtime.control({type:'volume',owner,value}))output.write(reg,n);},alternateCommand(){throw Error('Unexpected alternate music driver');},beginDelay(ticks){delay=ticks;},finishDelay:()=>active()?waitTicks(delay):Promise.resolve(),stopMusic(){if(active())stop();}},0,2);
  },stop,close(){if(closed)return;stop();closed=true;gain.disconnect();chip.delete();void context.close().catch(()=>{});}};
}
