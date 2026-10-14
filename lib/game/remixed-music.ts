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
export type RemixedMusicPaths=Readonly<Record<NativeMusicScore,string>>;

/** The source remixes retain short generated lead-ins. These offsets were
 * measured against the supplied Roland MT-32 reference renders. Retain the
 * existing legacy loop calibration without promoting it to a verified 1991
 * profile: current strict state comparisons do not establish complete repeat
 * boundaries, and Game over retains a different accumulator at this period.
 * Playback keeps the recording's natural speed and pitch. */
export const remixedMusicTiming:Record<NativeMusicScore,{cueOffset:number;loopDuration:number}>={
 titl:{cueOffset:.05,loopDuration:2394*secondsPerIrq},
 slct:{cueOffset:.85,loopDuration:4788*secondsPerIrq},
 vict:{cueOffset:.55,loopDuration:2580*secondsPerIrq},
 over:{cueOffset:.5,loopDuration:3032*secondsPerIrq},
};
export type RemixedMusicTiming=Readonly<Record<NativeMusicScore,Readonly<{cueOffset:number;loopDuration:number;introDuration?:number}>>>;

type ImmediateOriginalMusic=Awaited<ReturnType<typeof createNativeMusic>>&{fadeOutContinuous?:(waitTicks:(ticks:number)=>Promise<void>)=>Promise<void>};
type OriginalMusic=ImmediateOriginalMusic&{controlAsync?:(operation:Parameters<ImmediateOriginalMusic['control']>[0])=>Promise<number>;playAsync?:(name:NativeMusicScore)=>Promise<void>;stopAsync?:()=>Promise<void>;readonly playbackStartAt?:number;fadeOutObserved?:(waitTicks:(ticks:number)=>Promise<void>,observer:{volume(value:number,at:number):void;stopped():void})=>Promise<void>};
export type SynchronizedRemixedMusic=ReturnType<typeof createSynchronizedRemixedMusic>;

const encodedMusic=new Map<string,Promise<ArrayBuffer>>();

/** Begin the network transfer from an explicit play gesture. Decoding waits
 * for the game-owned AudioContext; score position still comes from the shared
 * original-music clock. */
export function preloadRemixedMusicFiles(names:readonly NativeMusicScore[]=nativeMusicScores,paths:RemixedMusicPaths=remixPaths,signal?:AbortSignal){
 return Promise.all(names.map(async name=>{
  if(signal?.aborted)throw new DOMException('Music loading cancelled','AbortError');
  const path=paths[name];if(typeof path!=='string'||!path)throw Error('Missing remixed music source: '+name);
  // Abortable run-owned loads must not cancel or inherit a shared transfer.
  let transfer=signal?undefined:encodedMusic.get(path);
  if(!transfer){
   // Run-owned preview/retry loads must not inherit a cached404 from an
   // earlier local server configuration. Ordinary released assets keep cache.
   // Versioned new-edition assets can appear after a local hot update. Revalidate
   // rather than retaining an earlier cached 404; shared in-memory loads still dedupe.
   const cache=signal?'no-store':/^\/audio\/remixed\/ms91(?:-|\/)/.test(path)?'no-cache':'force-cache';
   transfer=fetch(path,{cache,priority:'low',signal} as RequestInit&{priority:'low'}).then(async response=>{
    if(!response.ok)throw Error(`Remixed score failed to load: ${name}`);
    return response.arrayBuffer();
   }).catch(error=>{if(!signal)encodedMusic.delete(path);throw error;});
   if(!signal)encodedMusic.set(path,transfer);
  }
  return [name,await transfer] as const;
 })).then(entries=>Object.fromEntries(entries) as Partial<Record<NativeMusicScore,ArrayBuffer>>);
}

function waitForMusicLoad<T>(pending:Promise<T>,signal?:AbortSignal):Promise<T>{
 if(!signal)return pending;
 return new Promise((resolve,reject)=>{
  const abort=()=>{signal.removeEventListener('abort',abort);reject(new DOMException('Music loading cancelled','AbortError'));};
  signal.addEventListener('abort',abort,{once:true});
  pending.then(value=>{signal.removeEventListener('abort',abort);resolve(value);},error=>{signal.removeEventListener('abort',abort);reject(error);});
  if(signal.aborted)abort();
 });
}
export async function decodeRemixedMusic(context:AudioContext,names:readonly NativeMusicScore[]=nativeMusicScores,paths:RemixedMusicPaths=remixPaths,signal?:AbortSignal){
 const encoded=await waitForMusicLoad(preloadRemixedMusicFiles(names,paths,signal),signal);
 if(signal?.aborted)throw new DOMException('Music loading cancelled','AbortError');
 // Web Audio decoding itself cannot be cancelled. Stop awaiting it when the
 // run exits, and consume its eventual settlement without reviving playback.
 const entries=await waitForMusicLoad(Promise.all(names.map(async name=>[name,await context.decodeAudioData(encoded[name]!.slice(0))] as const)),signal);
 return Object.fromEntries(entries) as Partial<Record<NativeMusicScore,AudioBuffer>>;
}

/** Run both versions from one score clock and switch only their output gains.
 * The inactive version therefore remains at the corresponding musical time. */
export function createSynchronizedRemixedMusic(context:AudioContext,original:OriginalMusic,initialBuffers:Partial<Record<NativeMusicScore,AudioBuffer>>,initiallyEnabled=false,calibration:RemixedMusicTiming=remixedMusicTiming,options:{scheduledFade?:boolean;continuousOriginalFade?:boolean}={}){
 // Snapshot caller calibration so an unrelated edition cannot move a running
 // score. A profile is supplied explicitly; no 1991 offsets are guessed here.
 const timing=Object.fromEntries(nativeMusicScores.map(name=>{
  const value=calibration[name];
  if(!value||!Number.isFinite(value.cueOffset)||value.cueOffset<0||!Number.isFinite(value.loopDuration)||value.loopDuration<=0||(value.introDuration!==undefined&&(!Number.isFinite(value.introDuration)||value.introDuration<0)))throw Error('Invalid remixed timing calibration: '+name);
  return [name,{...value}];
 })) as Record<NativeMusicScore,{cueOffset:number;loopDuration:number;introDuration?:number}>;
 const buffers={...initialBuffers};
 const gain=context.createGain();gain.gain.value=0;
 if(options.scheduledFade&&!original.fadeOutObserved)throw Error('Scheduled remix fade requires original delivery observer');
 if(options.continuousOriginalFade&&!original.fadeOutContinuous)throw Error('Continuous Original fade requires timed output support');
 const fadeGain=options.scheduledFade?context.createGain():undefined;
 if(fadeGain){fadeGain.gain.value=1;gain.connect(fadeGain);fadeGain.connect(context.destination);}else gain.connect(context.destination);
 const resetFade=(value=1)=>{if(fadeGain){cancelAndHoldAudioParam(fadeGain.gain,context.currentTime);fadeGain.gain.setValueAtTime(value,context.currentTime);}};
 let enabled=initiallyEnabled,closed=false,paused=false,current:NativeMusicScore|undefined,source:AudioBufferSourceNode|undefined;
 let position=0,startedAt=0,generation=0,controlEpoch=0,starting=false;
 let continuousFadeOwner:number|undefined;
 const level=(value:number,at=context.currentTime,fade=0)=>{
  if(closed)return;const parameter=gain.gain;
  cancelAndHoldAudioParam(parameter,at);
  if(fade>0)parameter.linearRampToValueAtTime(value,at+fade);else parameter.setValueAtTime(value,at);
 };
 const release=()=>{if(!source)return;source.onended=null;try{source.stop();}catch{}source.disconnect();source.buffer=null;source=undefined;};
 const normalizedPosition=(name:NativeMusicScore,elapsed:number)=>{
  const {loopDuration,introDuration=0}=timing[name];
  if(elapsed>=0&&elapsed<introDuration)return elapsed;
  return introDuration+(((elapsed-introDuration)%loopDuration)+loopDuration)%loopDuration;
 };
 const offsetAt=(at=context.currentTime)=>{
  if(!current)return 0;
  return normalizedPosition(current,position+(!paused?Math.max(0,at-startedAt):0));
 };
 const begin=(name:NativeMusicScore,offset:number,at:number)=>{
  release();const buffer=buffers[name],scoreTiming=timing[name];
  position=normalizedPosition(name,offset);startedAt=at;
  if(!buffer)return false;
  const next=context.createBufferSource();
  const loopStart=scoreTiming.cueOffset+(scoreTiming.introDuration??0);
  if(loopStart+scoreTiming.loopDuration>buffer.duration)throw Error(`Remixed score is shorter than the original loop: ${name}`);
  next.buffer=buffer;next.loop=true;next.loopStart=loopStart;next.loopEnd=loopStart+scoreTiming.loopDuration;next.connect(gain);source=next;
  next.start(at,scoreTiming.cueOffset+position);return true;
 };
 const stop=()=>{generation++;controlEpoch++;starting=false;resetFade(0);release();current=undefined;position=0;original.stop();};
 const startOffset=(at:number)=>{
  const anchor=original.playbackStartAt;
  if(anchor===undefined)return 0;
  if(!Number.isFinite(anchor))throw Error('Invalid original music playback anchor');
  return Math.max(0,at-anchor);
 };
 const beginControl=(operation:Parameters<OriginalMusic['control']>[0])=>{
  const at=context.currentTime;
  if(operation==='pause-audio'&&current&&!paused){position=offsetAt(at);release();paused=true;level(0,at,SWITCH_FADE);}
 };
 const finishControl=(operation:Parameters<OriginalMusic['control']>[0],result:number,alreadyStarted=false)=>{
  const at=context.currentTime;
  if(operation==='resume-audio'&&current&&paused){
   paused=false;
   if(original.settings.musicEnabled){const start=at+SCHEDULE_LEAD,available=begin(current,position,start);level(enabled&&available?1:0,start);original.setOutputMuted(enabled,start);}
  }
  else if(operation==='toggle-music'){
   generation++;resetFade();release();position=0;paused=original.settings.paused;level(0,at,SWITCH_FADE);
   if(original.settings.musicEnabled&&current){
    // The source toggle enables the driver but cannot reconstruct the score it
    // just stopped. The browser host still owns that score selection, so start
    // both versions together from its first musical boundary.
    original.setOutputMuted(enabled);if(!alreadyStarted)original.play(current);
    if(!paused){const start=at+SCHEDULE_LEAD,available=begin(current,alreadyStarted?startOffset(start):0,start);level(enabled&&available?1:0,start);original.setOutputMuted(enabled,start);}
   }else original.setOutputMuted(enabled,at,SWITCH_FADE);
  }
  return result;
 };
 const control=(operation:Parameters<OriginalMusic['control']>[0])=>{
  beginControl(operation);return finishControl(operation,original.control(operation));
 };
 let controls:Promise<unknown>=Promise.resolve();
 const controlAsync=(operation:Parameters<OriginalMusic['control']>[0])=>{
  const owner=controlEpoch;
  const pending=controls.catch(()=>{}).then(async()=>{
   if(closed||owner!==controlEpoch)throw new DOMException('Music control superseded','AbortError');
   beginControl(operation);
   const result=original.controlAsync?await original.controlAsync(operation):original.control(operation);
   if(closed||owner!==controlEpoch)throw new DOMException('Music control superseded','AbortError');
   let alreadyStarted=false;
   if(operation==='toggle-music'&&original.settings.musicEnabled&&current&&original.playAsync){
    starting=true;release();level(0);original.setOutputMuted(enabled);await original.playAsync(current);alreadyStarted=true;
    if(closed||owner!==controlEpoch)throw new DOMException('Music restart superseded','AbortError');
    starting=false;
   }
   return finishControl(operation,result,alreadyStarted);
  });controls=pending;return pending;
 };
 const setEnabled=(next:boolean)=>{
  if(closed||enabled===next)return;enabled=next;const at=context.currentTime;
  // Once the Original exit ramp starts, retain its output ownership until it
  // ends. Remember a mode change for the next score without cancelling that
  // ramp or introducing the prepared remix at full volume during race loading.
  if(continuousFadeOwner===generation)return;
  if(enabled&&current&&!paused&&!starting&&original.settings.musicEnabled&&!source&&buffers[current]){
   const start=at+SCHEDULE_LEAD,offset=offsetAt(start),available=begin(current,offset,start);original.setOutputMuted(available,start,SWITCH_FADE);level(available?1:0,start,SWITCH_FADE);return;
  }
  const available=!!source;original.setOutputMuted(enabled,at,SWITCH_FADE);level(enabled&&available&&!paused&&original.settings.musicEnabled?1:0,at,SWITCH_FADE);
 };
 original.setOutputMuted(enabled);
 return {
  get playbackSnapshot(){return {score:current,position:offsetAt(),paused,starting,enabled,hasSource:!!source,sampleRate:source?.buffer?.sampleRate,loopStart:source?.loopStart,loopEnd:source?.loopEnd};},
  control,controlAsync,setEnabled,setOutputMuted:original.setOutputMuted,fadeTicks:original.fadeTicks,get enabled(){return enabled;},get settings(){return original.settings;},
  addBuffers(next:Partial<Record<NativeMusicScore,AudioBuffer>>){
   if(closed)return;
   Object.assign(buffers,next);if(continuousFadeOwner===generation||starting||!enabled||!current||paused||!original.settings.musicEnabled||source||!buffers[current])return;
   const at=context.currentTime,start=at+SCHEDULE_LEAD,offset=offsetAt(start),available=begin(current,offset,start);original.setOutputMuted(available,start,SWITCH_FADE);level(available?1:0,start,SWITCH_FADE);
  },
  play(name:NativeMusicScore){
   if(closed)return;generation++;controlEpoch++;starting=false;resetFade();release();current=name;position=0;paused=original.settings.paused;
   original.setOutputMuted(enabled);original.play(name);if(!original.settings.musicEnabled){level(0);return;}
   // Updated mode must not leak the original device while decoding. Keep its
   // score clock running silently so late buffers still join in synchronization.
   const start=context.currentTime+SCHEDULE_LEAD,available=!paused&&begin(name,0,start);level(enabled&&!!available?1:0,start);original.setOutputMuted(enabled,start);
  },
  playAsync(name:NativeMusicScore){
   if(closed)return Promise.reject(new DOMException('Music closed','AbortError'));
   generation++;const owner=++controlEpoch;starting=true;resetFade();release();level(0);current=name;position=0;
   const pending=controls.catch(()=>{}).then(async()=>{
    if(closed||owner!==controlEpoch)throw new DOMException('Music start superseded','AbortError');
    original.setOutputMuted(enabled);
    if(original.playAsync)await original.playAsync(name);else original.play(name);
    if(closed||owner!==controlEpoch)throw new DOMException('Music start superseded','AbortError');
    starting=false;
    paused=original.settings.paused;
    if(!original.settings.musicEnabled){level(0);return;}
    const start=context.currentTime+SCHEDULE_LEAD,available=!paused&&begin(name,startOffset(start),start);
    level(enabled&&!!available?1:0,start);original.setOutputMuted(enabled,start);
   });controls=pending;return pending;
  },
  async fadeOut(waitTicks:(ticks:number)=>Promise<void>){
   if(closed)return;controlEpoch++;starting=false;const owner=++generation,at=context.currentTime;
   if(!enabled&&options.continuousOriginalFade){
    continuousFadeOwner=owner;
    try{await original.fadeOutContinuous!(waitTicks);if(closed||owner!==generation)return;release();current=undefined;position=0;}
    finally{if(continuousFadeOwner===owner)continuousFadeOwner=undefined;}
    return;
   }
   if(fadeGain){
    try{
     await original.fadeOutObserved!(waitTicks,{volume(value,time){if(closed||owner!==generation)return;if(!Number.isFinite(time)||!Number.isFinite(value)||value<0||value>100)throw Error('Invalid scheduled remix fade');fadeGain.gain.setValueAtTime(value/100,time);},stopped(){if(closed||owner!==generation)return;resetFade(0);release();}});
     if(closed||owner!==generation)return;release();current=undefined;position=0;return;
    }catch(error){
     if(!closed&&owner===generation){resetFade(0);release();current=undefined;position=0;}
     throw error;
    }
   }
   if(enabled&&source){const ticksPerSecond=PC_PIT_INPUT_HZ/ORIGINAL_PIT_DIVISOR;level(0,at,original.fadeTicks/ticksPerSecond);}
   await original.fadeOut(waitTicks);if(closed||owner!==generation)return;release();current=undefined;position=0;
  },
  stop,
  async stopAsync(){
   generation++;controlEpoch++;starting=false;resetFade(0);release();current=undefined;position=0;
   if(original.stopAsync)await original.stopAsync();else original.stop();
   await controls.catch(()=>{});
  },
  close(){if(closed)return;closed=true;generation++;controlEpoch++;release();for(const name of nativeMusicScores)delete buffers[name];gain.disconnect();fadeGain?.disconnect();original.close();},
 };
}
