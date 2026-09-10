import {createAudioResumeGate} from './audio-resume-gate.ts';
import {audioBufferBatch} from './audio-buffer-batch.ts';
import {createNativeRaceAudioStream,type NativeAudioMemory} from './native-race-audio-stream.ts';
import {preparePlayerAudioResources} from './prepare-player-audio-resources.ts';
import {createOplOutput} from './opl-output.ts';
import {createQueuedPlayerAudioStream} from './player-audio-stream.ts';
import type {PlayerAudioSeed} from './player-audio.ts';
import type {DrivingAudioQueueSeed} from './driving-audio-queue.ts';

interface Chip {
  write(register: number, value: number): void;
  generate(samples: number): void;
  getBuffer(): Int16Array;
  delete(): void;
}
interface OplModule {
  OPL: new (rate: number, channels: number, bytes: number) => Chip;
}
declare global {
  interface Window {
    opl?: (options: {
      locateFile: (name: string) => string;
      onAbort: (reason: unknown) => void;
    }) => {
      then: (ready: (module: OplModule) => void) => void;
    };
  }
}
let loading: Promise<void> | undefined;
function loadLibrary(): Promise<void> {
  return (loading ??= new Promise((resolve, reject) => {
    if (window.opl) return resolve();
    const script = document.createElement('script');
    script.src = '/audio/opl.js';
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      loading = undefined;
      reject(Error('AdLib emulator could not load'));
    };
    document.head.appendChild(script);
  }));
}

export interface NativeAudio {
  update(rpm: number,flags?:number): void;
  setEnabled(enabled:boolean):void;
  impacts(flags:number):void;
  crash(handle?:number): void;
  reset(rpm: number): void;
  resume(): Promise<void>;
  pause(): void;
  volume(value: number): void;
  close(): void;
}

async function loadSoundBank(name:string){
  const response=await fetch(`/game/sound-banks/${name}`);
  if(!response.ok)throw Error(`Original sound file ${name} could not load`);
  return new Uint8Array(await response.arrayBuffer());
}

/** Recovered sound runtime on one sample-aligned OPL stream. The native race
 * supplies its shared queue memory; standalone test circuits retain player audio. */
export async function createNativeAudio(
  context: AudioContext,
  raceMemory?:NativeAudioMemory,
): Promise<NativeAudio> {
  let chip: Chip | undefined;
  try {
    const [, seed, effectBank, voiceBank, carSlots] = await Promise.all([
      loadLibrary(),
      fetch('/game/effect-runtime-seed.json').then((r) => {
        if (!r.ok) throw Error('Original sound instruments could not load');
        return r.json() as Promise<PlayerAudioSeed & {queue:DrivingAudioQueueSeed}>;
      }),
      loadSoundBank('GEENG.SFX'),
      loadSoundBank('ADENG1.VCE'),
      raceMemory?fetch('/game/retained-audio-cars.json').then(async r=>{if(!r.ok)throw Error('Original car audio tables could not load');return (await r.json() as {cars:number[][]}).cars;}):Promise.resolve(undefined),
    ]);
    const data=preparePlayerAudioResources(seed,effectBank,voiceBank);
    let createChip: (()=>Chip) | undefined;
    chip = await new Promise<Chip>((resolve, reject) => {
      let settled = false;
      const fail = (reason: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(Error(String(reason)));
      };
      const timeout = setTimeout(
        () => fail('AdLib initialization timed out'),
        15000,
      );
      window.opl!({
        locateFile: (name) => `/audio/${name}`,
        onAbort: fail,
      }).then((module) => {
        if (settled) return;
        try {
          createChip=()=>new module.OPL(context.sampleRate*2, 2, 2048);
          const result = createChip();
          settled = true;
          clearTimeout(timeout);
          resolve(result);
        } catch (error) {
          fail(error);
        }
      });
    });
    let synth = chip;
    const createStream=(target:Chip)=>{
      if(raceMemory&&carSlots){
        const shared=createNativeRaceAudioStream(seed,carSlots,effectBank,voiceBank,raceMemory,createOplOutput(target),context.sampleRate);
        return {...shared,enqueue:(_car:Parameters<ReturnType<typeof createQueuedPlayerAudioStream>['enqueue']>[0],_flags?:number)=>shared.enqueue()};
      }
      return createQueuedPlayerAudioStream(data,data.queue,createOplOutput(target),context.sampleRate);
    };
    let stream=createStream(synth);
    const gain = context.createGain();
    gain.gain.value = 0.6;
    gain.connect(context.destination);
    const sources = new Map<AudioBufferSourceNode,number>();
    const resumeGate=createAudioResumeGate();
    let closed = false,
      effectsEnabled=true,
      paused = true,
      next = 0,
      timer: ReturnType<typeof setInterval> | undefined;
    const update = (rpm: number,flags?:number) => {
      if (closed) return;
      // Original following-car listener produces zero relative vectors.
      stream.enqueue({rpm,current:[0,0,0],previous:[0,0,0]},flags);
    };
    const releaseSource=(source:AudioBufferSourceNode)=>{
      sources.delete(source);source.onended=null;
      try{source.stop();}catch{/* Source may have already ended. */}
      source.disconnect();source.buffer=null;
    };
    const pump = () => {
      if (closed || paused || context.state !== 'running') return;
      const now=context.currentTime;
      for(const [source,end] of sources)if(end<=now)releaseSource(source);
      next = audioBufferBatch(next, now, 512 / context.sampleRate, start => {
        const raw = stream.render(512);
        const buffer = context.createBuffer(2, 512, context.sampleRate);
        for (let c = 0; c < 2; c++) {
          const output = buffer.getChannelData(c);
          for (let i = 0; i < 512; i++) output[i] = raw[i * 2 + c] / 32768;
        }
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(gain);
        sources.set(source,start+buffer.duration);
        source.onended = () => releaseSource(source);
        source.start(start);
      });
    };
    const pause = () => {
      resumeGate.cancel();
      paused = true;
      clearInterval(timer);
      for (const source of sources.keys()) releaseSource(source);
      sources.clear();
      next = 0;
    };
    return {
      update,
      setEnabled(enabled){if(closed)return;effectsEnabled=enabled;stream.setEnabled(enabled);},
      impacts(flags){if(!closed)stream.impacts(flags);},
      crash(handle=0){if(!closed)stream.crash(handle);},
      reset(rpm){
        if(closed)return;
        const wasPaused=paused;pause();stream.exit();
        const replacement=createChip!();
        let replacementStream:ReturnType<typeof createStream>;
        try{replacementStream=createStream(replacement);}
        catch(error){replacement.delete();throw error;}
        synth.delete();synth=replacement;chip=replacement;stream=replacementStream;
        stream.setEnabled(effectsEnabled);update(rpm);paused=wasPaused;
        if(!paused){pump();timer=setInterval(pump,25);}
      },
      async resume() {
        if (closed) return;
        await resumeGate.resume(()=>context.resume(),()=>{
          if (closed) return;
          paused = false;
          clearInterval(timer);
          pump();
          timer = setInterval(pump, 25);
        });
      },
      pause,
      volume(value) {
        gain.gain.value = Math.max(0, Math.min(1, value));
      },
      close() {
        if (closed) return;
        pause();
        closed = true;
        try{stream.exit();}
        finally{
          gain.disconnect();
          synth.delete();
          void context.close().catch(() => {});
        }
      },
    };
  } catch (error) {
    chip?.delete();
    await context.close().catch(() => {});
    throw error;
  }
}

/** Shared original AdLib synthesis backend for the native opening score. */
export async function createOriginalOplChip(context:AudioContext):Promise<Chip>{
 await loadLibrary();
 return new Promise((resolve,reject)=>{
  let settled=false;
  const timeout=setTimeout(()=>{settled=true;reject(Error('AdLib initialization timed out'));},15000);
  window.opl!({locateFile:name=>'/audio/'+name,onAbort:reason=>{if(!settled){settled=true;clearTimeout(timeout);reject(Error(String(reason)));}}}).then(module=>{if(settled)return;settled=true;clearTimeout(timeout);try{resolve(new module.OPL(context.sampleRate*2,2,2048));}catch(e){reject(e);}});
 });
}
