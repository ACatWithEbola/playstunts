/** Offline diagnostic renders under an explicit nominal CPU profile. Not
 * physical-PC timing or listening acceptance; never overwrite existing files. */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {isAbsolute,join} from 'node:path';
import createMunt from '../public/game/mt32-local/munt.mjs';
import {createMt32WasmOutput,type Mt32Wasm} from '../lib/game/mt32-wasm-output.ts';
import {createTimedMt32SongFactory} from '../lib/game/timed-mt32-song-factory.ts';
import {PC_PIT_INPUT_HZ} from '../lib/game/timer-interrupt.ts';
import type {OriginalMt32MusicSeed} from '../lib/game/mt32-music-runtime.ts';
import type {NativeMusicScore} from '../lib/game/native-music-score.ts';
import {createNoteIsolation} from './mt32-note-isolation.ts';
const traceMidi=process.argv.includes('--trace-midi');
const tracePatches=process.argv.includes('--trace-patches');
if(tracePatches&&!traceMidi)throw Error('Patch snapshots require MIDI tracing');
const [directory,generation,secondsText,channelText,noteText]=process.argv.slice(2).filter(value=>!['--trace-midi','--trace-patches'].includes(value)),seconds=Number(secondsText);
// Allow a bounded multi-repeat diagnostic so a first-pass comparison does
// not implicitly certify the original driver's subsequent repeat state.
if(!directory||!isAbsolute(directory)||existsSync(directory)||!['ms-1990','ms-1991'].includes(generation)||!Number.isSafeInteger(seconds)||seconds<1||seconds>600)throw Error('Provide NEW absolute directory, ms-1990/ms-1991, and 1..600 seconds');
const names=['titl','slct','vict','over'] as const;
const seeds=Object.fromEntries(names.map(name=>[name,JSON.parse(readFileSync(`public/game/mt32-music-${name}-seed.json`,'utf8'))])) as Record<NativeMusicScore,OriginalMt32MusicSeed>;
const diagnostics:string[]=[];
const module=await createMunt({wasmBinary:readFileSync('public/game/mt32-local/munt.wasm'),print:(message:string)=>diagnostics.push(message),printErr:(message:string)=>diagnostics.push(message)});
const device=createMt32WasmOutput(module as unknown as Mt32Wasm,readFileSync('public/game/mt32-local/ctrl_mt32_1_07.rom'),readFileSync('public/game/mt32-local/pcm_mt32.rom'));
let isolated:ReturnType<typeof createMt32WasmOutput>|undefined;
let rendering=device;
if(channelText!==undefined){
 const mask=createNoteIsolation(Number(channelText),noteText===undefined?undefined:Number(noteText));
 const second=await createMunt({wasmBinary:readFileSync('public/game/mt32-local/munt.wasm'),print(){},printErr(){}});
 isolated=createMt32WasmOutput(second as unknown as Mt32Wasm,readFileSync('public/game/mt32-local/ctrl_mt32_1_07.rom'),readFileSync('public/game/mt32-local/pcm_mt32.rom'));
 // Unfiltered synth remains the authority for startup settling/active state.
 // Both synths receive the same render counts; transport bytes are not dropped.
 rendering={...device,write(writes){device.write(writes);isolated!.write(mask(writes));},render(frames){device.render(frames);return isolated!.render(frames);}};
}
let renderedFrames=0;
const delivered:{frame:number;port:number;byte:number}[]=[];
const patchStates:{fromFrame:number;toFrame:number;patchTemp:number[];channels:number[]}[]=[];
let lastPatchState='';
const samplePatchState=(fromFrame:number,toFrame:number)=>{
 const state={patchTemp:Array.from(device.read(0xc000,144)),channels:Array.from(device.read(0x4000d,9))},encoded=JSON.stringify(state);
 if(encoded!==lastPatchState){patchStates.push({fromFrame,toFrame,...state});lastPatchState=encoded;}
};
if(traceMidi){
 const underlying=rendering;
 rendering={...underlying,write(writes){for(const [port,byte] of writes)delivered.push({frame:renderedFrames,port,byte});underlying.write(writes);},render(frames){const start=renderedFrames,pcm=underlying.render(frames);renderedFrames+=frames;if(tracePatches)samplePatchState(start,renderedFrames);return pcm;}};
}
const profile={cpuHz:4772728,pollCycles:20,resetClocks:Math.ceil(.014*PC_PIT_INPUT_HZ),initialPort61:0,interrupts(){},yieldTask:async()=>{}};
mkdirSync(directory);const files=[];
try{
 const factory=createTimedMt32SongFactory(rendering,seeds,readFileSync('public/game/original-resources/MT32.PLB'),generation as 'ms-1990'|'ms-1991',profile);
 for(const name of names){
  delivered.length=0;
  const song=await factory(name,()=>false),pcmOriginFrame=renderedFrames,frames=device.sampleRate*seconds,wav=Buffer.alloc(44+frames*4);
  patchStates.length=0;lastPatchState='';if(tracePatches)samplePatchState(pcmOriginFrame,pcmOriginFrame);
  wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(device.sampleRate,24);wav.writeUInt32LE(device.sampleRate*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(frames*4,40);
  let clippedSamples=0;
  for(let frame=0;frame<frames;frame+=512){
   const pcm=await song.score.render(Math.min(512,frames-frame));
   for(let index=0;index<pcm.length;index++){
    const sample=pcm[index];if(!Number.isFinite(sample))throw Error('Nonfinite rendered audio');
    if(Math.abs(sample)>1)clippedSamples++;
    wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,sample))*32767),44+(frame*2+index)*2);
   }
  }
  if(traceMidi)writeFileSync(join(directory,name+'-delivered-midi.json'),JSON.stringify({sampleRate:device.sampleRate,pcmOriginFrame,frames,generation,events:delivered.map(event=>[event.frame-pcmOriginFrame,event.port,event.byte]),startupEventsRetained:true,finalChannelAssignments:Array.from(device.read(0x4000d,9)),finalPatchTemp:Array.from(device.read(0xc000,144)),finalTimbreTemp:Array.from({length:8},(_,part)=>Array.from(device.read(0x10000+part*246,246))),scope:'Original byte delivery relative to actual factory-rendered PCM, before note-isolation mask; synth processing latency and audible attacks are not certified'},null,2),{flag:'wx'});
  if(tracePatches)writeFileSync(join(directory,name+'-patch-states.json'),JSON.stringify({generation,sampleRate:device.sampleRate,frames,states:patchStates.map(state=>({...state,fromFrame:state.fromFrame-pcmOriginFrame,toFrame:state.toFrame-pcmOriginFrame})),scope:'Resolved patch changes bracketed by synthesis blocks; not exact MIDI processing or audible onset timestamps'},null,2),{flag:'wx'});
  song.score.close();await song.release();const path=join(directory,name+'.wav');writeFileSync(path,wav,{flag:'wx'});files.push({name,path,frames,clippedSamples});
 }
 writeFileSync(join(directory,'manifest.json'),JSON.stringify({generation,seconds,traceMidi,tracePatches,sampleRate:device.sampleRate,cpuHz:profile.cpuHz,pollCycles:profile.pollCycles,resetClocks:profile.resetClocks,...(channelText===undefined?{}:{isolation:{channel:Number(channelText),note:noteText===undefined?null:Number(noteText),unfilteredSettlingAuthority:true}}),files,diagnostics,physicalTimingOrEnhancedAlignmentVerified:false},null,2),{flag:'wx'});
 console.log(JSON.stringify({directory,files,physicalTimingOrEnhancedAlignmentVerified:false}));
}finally{isolated?.close();device.close();}
