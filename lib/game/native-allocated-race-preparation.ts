import {writeRetainedMenuSession} from './retained-menu-session.ts';
import {initializeOriginalMt32Memory} from './initialize-mt32-memory.ts';
import {loadNativeRawResource} from './load-raw-resource.ts';
import {freeResource} from './free-resource.ts';
import {allocateOriginalRenderQueue} from './allocate-render-queue.ts';
import {allocateOriginalGameBuffers} from './allocate-game-buffers.ts';
import {allocateOriginalReplayCheckpoints} from './allocate-replay-checkpoints.ts';
import {initializeOriginalTrackCoordinates} from './initialize-track-coordinates.ts';
import {initializeOriginalPcSpeakerMemory} from './initialize-pc-speaker-memory.ts';
import {initializeOriginalTandyMemory} from './initialize-tandy-memory.ts';
import {initializeLoadedAudioDriver} from './initialize-loaded-audio-driver.ts';
import {resetOriginalAdlibMemory} from './reset-adlib-memory.ts';
import {enterCompleteNativeRace} from './complete-race-entry.ts';
import {loadNativeCatalogReplay} from './load-catalog-replay.ts';
import {analyzeAllocatedDisplayTrackAtFrame} from './analyze-allocated-track.ts';
import {analyzeRoute} from '../physics/route-analysis.ts';
import {writeAnalyzedTrackMemory} from './write-analyzed-track-memory.ts';
import {saveOriginalRaceMenuState} from './race-menu-state.ts';
import {originalRandomByte} from './original-random.ts';
import {loadNativeOpponentPreparation} from './load-opponent-preparation.ts';
import type {NativeDemoData,NativeDemoMenuState} from './native-demo-runtime.ts';
export interface NativeSelectedReplay {bytes:Uint8Array;name:string;path:string}
/** Shared native resource entry for an unattended demo or a fresh manual race.
 * Simulation and browser input remain owned by the surrounding race runner. */
export async function prepareNativeAllocatedRace(data:NativeDemoData,menu:NativeDemoMenuState,demo:boolean,progress:(stage:number)=>void=()=>{},recording?:NativeSelectedReplay){
 const d=0x2d1a0,c=0x209e0,bp=0xeefe,driver=0x39e1;
 if(data.base.length!==0x100000||menu.configuration.length!==24||menu.track.length!==1802)throw Error('Incomplete original race startup data');
 let memory:Uint8Array=data.base.slice();
 if(menu.retainedSession)writeRetainedMenuSession(memory,d,menu.retainedSession);
 if(menu.randomState){if(menu.randomState.length!==6)throw Error('Original byte generator requires six bytes');memory.set(menu.randomState,d+0x9f5c);}
 initializeOriginalTrackCoordinates(memory,d,bp);
 for(const allocate of [(m:Uint8Array)=>allocateOriginalRenderQueue(m,d),(m:Uint8Array)=>allocateOriginalGameBuffers(m,d,bp),(m:Uint8Array)=>allocateOriginalReplayCheckpoints(m,d)]){
  const result=allocate(memory);if(result.error)throw Error('Original race allocation failed: '+result.error);memory=result.memory;
 }
 const word=(at:number)=>new DataView(memory.buffer,memory.byteOffset,memory.byteLength).getUint16(d+at,true);
 const trackAddress=word(0x9356)+word(0x9358)*16;
 memory.set(menu.track,trackAddress);memory.set(menu.configuration,d+0x8fc2);
 const path=new TextEncoder().encode((menu.path??'')+'\0');if(path.length>82)throw Error('Original track path is too long');memory.set(path,d+0x98);
 if(recording){
  const filename=new TextEncoder().encode(recording.name+'\0');if(filename.length>9)throw Error('Original replay name exceeds eight characters');memory.set(filename,d+0xea);
  const directory=new TextEncoder().encode(recording.path+'\0');if(directory.length>82)throw Error('Original replay directory is too long');memory.set(directory,d+0x98);
  new DataView(memory.buffer).setUint16(d+0x8a10,150,true);
  // Options5882 calls149C4 with BP EEEE before2B1C saves the menu state.
  await loadNativeCatalogReplay(memory,d,{read:async()=>recording.bytes},0x98,0xea,0xeeee);
 }
 saveOriginalRaceMenuState(memory,d);
 const initialWrites:number[][]=[];
 if(data.soundDevice?.kind==='mt32'){
  const device=data.soundDevice,bytes=await data.catalog.read('MT15.DRV');if(!bytes||bytes.length!==1667)throw Error('Original MT15 driver data is missing');
  memory.set(bytes,driver*16);memory.set([77,84,0],d+0x7460);
  const initialized=await initializeOriginalMt32Memory(memory,d,driver,{
   async execute(program){const output=await (device.executeInitialization?.(program)??device.execute(program));initialWrites.push(...output.writes);return output.result;},
   async loadPatch(name){
    return await loadNativeRawResource({memory:()=>memory,writeMemory(next){memory.set(next);},async readFile(at){let filename='';for(let i=0;i<65536;i++){const byte=memory[d+((at+i)&65535)];if(!byte)return data.catalog.read(filename);filename+=String.fromCharCode(byte);}throw Error('Unterminated original patch filename');}},d,name,false)??{offset:0,segment:0};
   },
   freePatch(pointer){const freed=freeResource(memory,d,pointer.offset,pointer.segment);if(freed.error)throw Error('Original Roland patch release failed');memory.set(freed.memory);},
  });
  if(initialized)throw Error('Native MT15 initialization failed');
 }else if(data.soundDevice?.kind==='tandy'){
  const bytes=await data.catalog.read('TD15.DRV');if(!bytes||bytes.length!==2993)throw Error('Original TD15 driver data is missing');
  memory.set(bytes,driver*16);memory.set([84,68,0],d+0x7460);
  const initialized=await initializeOriginalTandyMemory(memory,d,driver,data.soundDevice.port61());
  if(initialized.result)throw Error('Native TD15 initialization failed');initialWrites.push(...initialized.writes);
  if(initialized.bios.length)data.soundDevice.bios(initialized.bios,memory);
 }else if(data.soundDevice?.kind==='pc-speaker'){
  const bytes=await data.catalog.read('PC15.DRV');if(!bytes||bytes.length!==2190)throw Error('Original PC15 driver data is missing');
  memory.set(bytes,driver*16);memory.set([80,67,0],d+0x7460);
  const initialized=await initializeOriginalPcSpeakerMemory(memory,d,driver,data.soundDevice.port61());
  if(initialized.result)throw Error('Native PC15 initialization failed');initialWrites.push(...initialized.writes);
 }else{
 const initialized=await initializeLoadedAudioDriver({memory:()=>memory,initializeDriver:()=>10,resetAudio(){initialWrites.push(...resetOriginalAdlibMemory(memory,d,driver));},async loadPatch(){throw Error('Unexpected AdLib patch request');},installPatch(){throw Error('Unexpected AdLib patch');},freePatch(){throw Error('Unexpected AdLib patch');},alternateCommand(){throw Error('Unexpected alternate audio command');}},d,{offset:0,segment:driver});
 if(initialized)throw Error('Native AdLib initialization failed');
 }
 memory[d+0x4e05]=Number(menu.soundEnabled);memory[d+0x134]=menu.graphics&255;memory[d+0x90f8]=Number(demo);memory[d+0x12f]=menu.camera&255;memory[d+0xaa46]=0;
 if(!demo){if(recording)memory[d+0x8018]=4;else new DataView(memory.buffer).setUint16(d+0x8fd8,0,true);}
 return {...await enterAllocatedRaceResources(data,memory,progress,!demo),initialWrites};
}
/** Reuse the outer allocation graph after results chooses Replay or Race.
 * The saved menu, recording bank and checkpoints stay owned by that graph. */
export async function prepareNativeAllocatedRaceReentry(data:NativeDemoData,before:Uint8Array,entry:'fresh'|'replay'|'resume',progress:(stage:number)=>void=()=>{}){
 const memory=before.slice(),d=0x2d1a0;
 if(memory[d+0x90f8])throw Error('Manual race reentry cannot consume a demo session');
 if(entry==='replay')memory[d+0x8018]=4;
 else if(entry==='fresh')new DataView(memory.buffer).setUint16(d+0x8fd8,0,true);
 return {...await enterAllocatedRaceResources(data,memory,progress,false),initialWrites:[] as number[][]};
}
async function enterAllocatedRaceResources(data:NativeDemoData,before:Uint8Array,progress:(stage:number)=>void,analyzeBeforeEntry:boolean):Promise<{memory:Uint8Array;raw:number[];trackAddress:number;opponentPath:number[]|null}>{
 let memory=before;const d=0x2d1a0,c=0x209e0,bp=0xeefe,demo=!!memory[d+0x90f8];
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),trackAddress=view.getUint16(d+0x9356,true)+view.getUint16(d+0x9358,true)*16;
 let raw:number[]=Array.from(memory.slice(trackAddress,trackAddress+1802)),opponentPath:number[]|null=null;
 const filename=(at:number)=>{let name='';for(let i=0;i<65536;i++){const byte=memory[d+((at+i)&65535)];if(!byte)return name;name+=String.fromCharCode(byte);}throw Error('Unterminated original resource filename');};
 const files={memory:()=>memory,writeMemory(next:Uint8Array){memory=next;},async exists(at:number){return data.catalog.exists(filename(at));},async readFile(at:number){return data.catalog.read(filename(at));},async retry(){throw Error('Original race resource could not load');}};
 const prepareTrack=(analysisFrame=0xeee2)=>{
  raw=Array.from(memory.slice(trackAddress,trackAddress+1802));
  const route=analyzeRoute(raw,data.records,data.vectors,data.samples,data.objects,undefined,{sample:false});
  // Original signed16-bit sample multiplication first wraps above520 nodes.
  if(route.route&&!route.route.error&&route.route.count>520){
   const prepared=analyzeAllocatedDisplayTrackAtFrame(memory,d,'mcga',analysisFrame,raw,data.records,data.vectors,data.samples,data.objects);memory=prepared.memory;raw=prepared.raw;
  }else memory=writeAnalyzedTrackMemory(memory,d,raw,analyzeRoute(raw,data.records,data.vectors,data.samples,data.objects)).memory;
 };
 if(analyzeBeforeEntry)prepareTrack();
 const entry=await enterCompleteNativeRace({...files,randomByte:()=>originalRandomByte(memory,d),
  loadDemo:(path,name)=>loadNativeCatalogReplay(memory,d,data.catalog,path,name,bp-0x1a),
  prepareTrack:()=>prepareTrack(bp-0x1e),
  progress,
  async prepareOpponent(framePointer){opponentPath=await loadNativeOpponentPreparation(files,d,framePointer);},stopEffect(){throw Error('Unexpected failed-race audio cleanup');},reportMemoryError(){throw Error('Original race ran out of resource memory');},async releaseInput(){},showWaiting(){},
 },d,c,bp);
 if(entry!=='ready')throw Error('Original race entry failed: '+entry);
 return {memory,raw,trackAddress,opponentPath};
}
