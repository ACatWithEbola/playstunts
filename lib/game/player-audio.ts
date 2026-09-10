import {exitDrivingAudio} from './driving-audio-exit-runtime.ts';
import {impactAudioRuntime} from './impact-audio-runtime.ts';
import {setEffectsEnabled} from './effect-mute.ts';
import {updateDrivingSoundRuntime} from './driving-sound-runtime.ts';
import {startEngineRuntime,type EngineRuntimeStartState} from './engine-runtime-start.ts';
import {stepEngineInterrupt} from './engine-interrupt.ts';
import {startCrashRuntime} from './crash-runtime.ts';
import {updateCarAudioTarget} from './car-audio-target.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';
import type {Vector} from '../physics/math.ts';
type EncodedEffect=Omit<LoadedEffectResource,'header'|'instrument'|'sequence'>&{header:number[];instrument:number[];sequence:number[]};
export interface PlayerAudioSeed {
 activeAudio:boolean;savedVolumes:number[];soundFlags?:number;car:number[];command:number[];carCounter:number;timers:number[][];voices:number[][];lastNotes:number[];markers:number[];busy:number[];velocities:number[];driverSegment:number;master:number;enabled:boolean;
 engine:{offset:number;segment:number;instrument:number[]};resources:Record<string,EncodedEffect>;
}
/** Player engine and crash audio, initialized exclusively from captured state.
 * All returned register writes belong to one shared OPL chip. update() consumes
 * original caller-relative vectors; tick() is one accepted original audio IRQ.
 */
export function createPlayerAudio(seed:PlayerAudioSeed){
 const engine=Uint8Array.from(seed.engine.instrument);
 const resources:LoadedEffectResource[]=Object.values(seed.resources).map(r=>({...r,header:Uint8Array.from(r.header),instrument:Uint8Array.from(r.instrument),sequence:Uint8Array.from(r.sequence)}));
 resources.push({headerOffset:0,headerSegment:0,header:new Uint8Array(),sequenceOffset:0,sequenceSegment:0,sequence:new Uint8Array(),instrumentOffset:seed.engine.offset,instrumentSegment:seed.engine.segment,instrument:engine});
 const initial={car:Uint8Array.from(seed.car),command:Uint8Array.from(seed.command),timers:seed.timers.map(t=>Uint8Array.from(t)),voices:seed.voices.map(v=>Uint8Array.from(v)),lastNotes:Uint8Array.from(seed.lastNotes),velocities:seed.velocities.slice(),driverSegment:seed.driverSegment};
 const started=startEngineRuntime(initial,engine);
 let state:EngineRuntimeStartState&{enabled:number;savedVolumes:Uint8Array;soundFlags:number;carCounter:number;markers:Uint8Array;busy:number[];writes:number[][]}={...started,enabled:seed.enabled?1:0,savedVolumes:Uint8Array.from(seed.savedVolumes),soundFlags:seed.soundFlags??0,carCounter:seed.carCounter,markers:Uint8Array.from(seed.markers),busy:seed.busy.slice()};
 return {
  initialWrites:started.writes,
  exit(active:boolean,read:number,write:number){const next=exitDrivingAudio({...state,paused:0},{active:active?1:0,read,write,playerFlags:state.soundFlags,opponentFlags:0,opponentEnabled:0,playerHandle:0,opponentHandle:1},resources,!!state.enabled,seed.master);state={...state,...next.audio};return {writes:next.audio.writes,read:next.queue.read};},
  impacts(flags:number,active:boolean){const next=impactAudioRuntime(state,flags,active,resources,!!state.enabled,seed.master);state={...state,...next};return next.writes;},
  setEnabled(enabled:boolean){const next=setEffectsEnabled(state,enabled,(offset,segment)=>{const r=resources.find(r=>r.instrumentOffset===offset&&r.instrumentSegment===segment);if(!r)throw Error('Missing original mute instrument');return r.instrument;});state={...state,...next};return next.writes;},
  driveSounds(flags:number){const next=updateDrivingSoundRuntime(state,flags,resources,!!state.enabled,seed.master);state={...state,...next};return next.writes;},
  update(rpm:number,previous:Vector,current:Vector,interval:number){state.car=updateCarAudioTarget(state.car,rpm,previous,current,interval,engine[14],engine[15]);},
  tick(){const next=stepEngineInterrupt(state,resources,!!state.enabled,seed.master);state={...state,...next};return next.writes;},
  crash(){const next=startCrashRuntime(state,resources,!!state.enabled,seed.master);state={...state,...next};return next.writes;},
  /** Detached state for differential verification and diagnostics. */
  snapshot(){return structuredClone(state);},
 };
}
