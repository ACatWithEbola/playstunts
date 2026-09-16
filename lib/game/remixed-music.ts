import {ORIGINAL_PIT_DIVISOR,PC_PIT_INPUT_HZ} from './timer-interrupt.ts';
import type {createNativeMusic} from './native-music.ts';
import {nativeMusicScores,type NativeMusicScore} from './native-music-score.ts';
import {cancelAndHoldAudioParam} from './audio-param-automation.ts';

const REMIX_ROOT='/audio/remixed';
const SCHEDULE_LEAD=.015;
const SWITCH_FADE=.012;
const secondsPerIrq=ORIGINAL_PIT_DIVISOR/PC_PIT_INPUT_HZ;
const remixPaths:Record<NativeMusicScore,string>={
 titl:`${REMIX_ROOT}/titl.mp3`,
 slct:`${REMIX_ROOT}/slct.mp3`,
 vict:`${REMIX_ROOT}/vict.mp3`,
 over:`${REMIX_ROOT}/over.mp3`,
};

/** The source remixes retain short generated lead-ins. These offsets were
 * measured against the supplied Roland MT-32 reference renders. The loop IRQ
 * counts come from complete repeated sequencer states in the original scores,
 * so the browser files restart on the game's own musical boundaries without
 * changing their natural speed or pitch. */
export const remixedMusicTiming:Record<NativeMusicScore,{cueOffset:number;loopDuration:number}>={
 titl:{cueOffset:.05,loopDuration:2394*secondsPerIrq},
 slct:{cueOffset:.85,loopDuration:4788*secondsPerIrq},
 vict:{cueOffset:.55,loopDuration:2580*secondsPerIrq},
 over:{cueOffset:.5,loopDuration:3032*secondsPerIrq},
};

type OriginalMusic=Awaited<ReturnType<typeof createNativeMusic>>;
export type SynchronizedRemixedMusic=ReturnType<typeof createSynchronizedRemixedMusic>;

const encodedMusic=new Map<NativeMusicScore,Promise<ArrayBuffer>>();

/** Begin the network transfer from an explicit play gesture. Decoding waits
 * for the game-owned AudioContext; score position still comes from the shared
 * original-music clock. */
export function preloadRemixedMusicFiles(names:readonly NativeMusicScore[]=nativeMusicScores){
 return Promise.all(names.map(async name=>{
  let transfer=encodedMusic.get(name);
  if(!transfer){
   transfer=fetch(remixPaths[name],{cache:'force-cache',priority:'low'} as RequestInit&{priority:'low'}).then(async response=>{
    if(!response.ok)throw Error(`Remixed score failed to load: ${name}`);
    return response.arrayBuffer();
   }).catch(error=>{encodedMusic.delete(name);throw error;});
   encodedMusic.set(name,transfer);
  }
  return [name,await transfer] as const;
 })).then(entries=>Object.fromEntries(entries) as Partial<Record<NativeMusicScore,ArrayBuffer>>);
}

export async function decodeRemixedMusic(context:AudioContext,names:readonly NativeMusicScore[]=nativeMusicScores){
 const encoded=await preloadRemixedMusicFiles(names);
 const entries=await Promise.all(names.map(async name=>[name,await context.decodeAudioData(encoded[name]!.slice(0))] as const));
 return Object.fromEntries(entries) as Partial<Record<NativeMusicScore,AudioBuffer>>;
}

/** Run both versions from one score clock and switch only their output gains.
 * The inactive version therefore remains at the corresponding musical time. */
export function createSynchronizedRemixedMusic(context:AudioContext,original:OriginalMusic,initialBuffers:Partial<Record<NativeMusicScore,AudioBuffer>>,initiallyEnabled=false){
 const buffers={...initialBuffers};
 const gain=context.createGain();gain.gain.value=0;gain.connect(context.destination);
 let enabled=initiallyEnabled,closed=false,paused=false,current:NativeMusicScore|undefined,source:AudioBufferSourceNode|undefined;
 let position=0,startedAt=0,generation=0;
 const level=(value:number,at=context.currentTime,fade=0)=>{
  if(closed)return;const parameter=gain.gain;
  cancelAndHoldAudioParam(parameter,at);
  if(fade>0)parameter.linearRampToValueAtTime(value,at+fade);else parameter.setValueAtTime(value,at);
 };
 const release=()=>{if(!source)return;source.onended=null;try{source.stop();}catch{}source.disconnect();source.buffer=null;source=undefined;};
 const offsetAt=(at=context.currentTime)=>{
  if(!current)return 0;
  const duration=remixedMusicTiming[current].loopDuration;
  return ((position+(!paused?Math.max(0,at-startedAt):0))%duration+duration)%duration;
 };
 const begin=(name:NativeMusicScore,offset:number,at:number)=>{
  release();const buffer=buffers[name],timing=remixedMusicTiming[name];
  position=((offset%timing.loopDuration)+timing.loopDuration)%timing.loopDuration;startedAt=at;
  if(!buffer)return false;
  const next=context.createBufferSource();
  if(timing.cueOffset+timing.loopDuration>buffer.duration)throw Error(`Remixed score is shorter than the original loop: ${name}`);
  next.buffer=buffer;next.loop=true;next.loopStart=timing.cueOffset;next.loopEnd=timing.cueOffset+timing.loopDuration;next.connect(gain);source=next;
  next.start(at,timing.cueOffset+position);return true;
 };
 const stop=()=>{generation++;release();current=undefined;position=0;original.stop();};
 const control=(operation:Parameters<OriginalMusic['control']>[0])=>{
  const at=context.currentTime;
  if(operation==='pause-audio'&&current&&!paused){position=offsetAt(at);release();paused=true;level(0,at,SWITCH_FADE);}
  const result=original.control(operation);
  if(operation==='resume-audio'&&current&&paused){
   paused=false;
   if(original.settings.musicEnabled){const start=at+SCHEDULE_LEAD,available=begin(current,position,start);level(enabled&&available?1:0,start);original.setOutputMuted(enabled&&available,start);}
  }
  else if(operation==='toggle-music'){
   generation++;release();position=0;paused=original.settings.paused;level(0,at,SWITCH_FADE);
   if(original.settings.musicEnabled&&current){
    // The source toggle enables the driver but cannot reconstruct the score it
    // just stopped. The browser host still owns that score selection, so start
    // both versions together from its first musical boundary.
    original.setOutputMuted(enabled);original.play(current);
    if(!paused){const start=at+SCHEDULE_LEAD,available=begin(current,0,start);level(enabled&&available?1:0,start);original.setOutputMuted(enabled&&available,start);}
   }else original.setOutputMuted(enabled,at,SWITCH_FADE);
  }
  return result;
 };
 const setEnabled=(next:boolean)=>{
  if(closed||enabled===next)return;enabled=next;const at=context.currentTime;
  if(enabled&&current&&!paused&&original.settings.musicEnabled&&!source&&buffers[current]){
   const offset=offsetAt(at),start=at+SCHEDULE_LEAD,available=begin(current,offset,start);original.setOutputMuted(available,start,SWITCH_FADE);level(available?1:0,start,SWITCH_FADE);return;
  }
  const available=!!source;original.setOutputMuted(enabled&&available,at,SWITCH_FADE);level(enabled&&available&&!paused&&original.settings.musicEnabled?1:0,at,SWITCH_FADE);
 };
 original.setOutputMuted(enabled);
 return {
  control,setEnabled,setOutputMuted:original.setOutputMuted,fadeTicks:original.fadeTicks,get enabled(){return enabled;},get settings(){return original.settings;},
  addBuffers(next:Partial<Record<NativeMusicScore,AudioBuffer>>){
   Object.assign(buffers,next);if(closed||!enabled||!current||paused||!original.settings.musicEnabled||source||!buffers[current])return;
   const at=context.currentTime,offset=offsetAt(at),start=at+SCHEDULE_LEAD,available=begin(current,offset,start);original.setOutputMuted(available,start,SWITCH_FADE);level(available?1:0,start,SWITCH_FADE);
  },
  play(name:NativeMusicScore){
   if(closed)return;generation++;release();current=name;position=0;paused=original.settings.paused;
   original.setOutputMuted(enabled);original.play(name);if(!original.settings.musicEnabled){level(0);return;}
   const start=context.currentTime+SCHEDULE_LEAD,available=!paused&&begin(name,0,start);level(enabled&&!!available?1:0,start);original.setOutputMuted(enabled&&!!available,start);
  },
  async fadeOut(waitTicks:(ticks:number)=>Promise<void>){
   if(closed)return;const owner=++generation,at=context.currentTime;
   if(enabled&&source){const ticksPerSecond=PC_PIT_INPUT_HZ/ORIGINAL_PIT_DIVISOR;level(0,at,original.fadeTicks/ticksPerSecond);}
   await original.fadeOut(waitTicks);if(closed||owner!==generation)return;release();current=undefined;position=0;
  },
  stop,
  close(){if(closed)return;closed=true;generation++;release();gain.disconnect();original.close();},
 };
}
