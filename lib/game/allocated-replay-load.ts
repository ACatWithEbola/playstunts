import {loadNativeReplay} from './native-replay-load.ts';
import {loadNativeCatalogReplay} from './load-catalog-replay.ts';
import {loadNativeOpponentPreparation} from './load-opponent-preparation.ts';
import {freeCompleteNativeRaceResourcesAsync} from './complete-race-resource-cleanup.ts';
import {initializeNativeRaceResources} from './initialize-race-resources.ts';
import {analyzeRoute} from '../physics/route-analysis.ts';
import {analyzeAllocatedTrack,analyzeAllocatedDisplayTrackAtFrame} from './analyze-allocated-track.ts';
import {createLoadedNativeManualRaceRuntime,type createNativeManualRaceRuntime} from './native-manual-race-runtime.ts';
import type {NativeDemoData} from './native-demo-runtime.ts';
import {resolvePhysicsEngine,type PhysicsEngineVersion} from '../physics/engine-version.ts';
import {resolveReplayCadence,type ReplayCadence} from './replay-cadence.ts';
import {versionedRouteTables} from './versioned-route-tables.ts';
import {versionedOpponentResource} from './versioned-opponent-resource.ts';
import {hasReplayCheckpointCapacity} from './replay-checkpoint-capacity.ts';
import {growReplayCheckpoints} from './grow-replay-checkpoints.ts';
import {applyVersionedCockpitMetadata} from './versioned-cockpit-metadata.ts';
import {versionedPc15Resource} from './versioned-pc15-resource.ts';
import {loadedPc15Generation} from './loaded-pc15-generation.ts';
type Runtime=Awaited<ReturnType<typeof createNativeManualRaceRuntime>>;
export interface AllocatedReplayLoadServices {
 /** The original file dialog edits DS0098 (directory) and DS00EA (name). */
 selectReplay(memory:()=>Uint8Array):Promise<number>;
 readReplay(name:string):Promise<Uint8Array|null>;
 replayPhysicsEngine?():PhysicsEngineVersion;
 replayFramesPerSecond?():ReplayCadence;
 showWaiting():void;
 progress(stage:number):void;
 writeAudio(writes:number[][]):void|Promise<void>;
}
/** Original161EA load branch, retaining the outer recording/checkpoint graph.
 * Resource calls use the replay controller's actual nested stack frames. */
export async function loadAllocatedReplay(data:NativeDemoData,runtime:Runtime,services:AllocatedReplayLoadServices):Promise<Runtime|undefined>{
 const d=0x2d1a0,memory=()=>runtime.session.state.memory;
 const writeMemory=(next:Uint8Array)=>runtime.session.originalMemory.writeMemory(next);
 let raw=runtime.raw,opponentPath=runtime.opponentPath,replacement:Runtime|undefined;
 let selectedData=data;
 let growingCheckpoints=false;
 let releasedForGrowth=false;
 const growthRollback=memory().slice();
 const filename=(at:number)=>{let name='';for(let i=0;i<65536;i++){const byte=memory()[d+((at+i)&65535)];if(!byte)return name;name+=String.fromCharCode(byte);}throw Error('Unterminated original resource filename');};
 const soundResource=(name:string)=>data.soundDevice?.kind==='pc-speaker'?versionedPc15Resource(name,loadedPc15Generation(memory(),d)):undefined;
 const files={memory,writeMemory,async exists(at:number){return !!soundResource(filename(at))||!!versionedOpponentResource(filename(at),selectedData.physicsEngine)||data.catalog.exists(filename(at));},async readFile(at:number){return soundResource(filename(at))??versionedOpponentResource(filename(at),selectedData.physicsEngine)??data.catalog.read(filename(at));},async retry(){throw Error('Original replay resource could not load');}};
 const prepareOpponent=async(framePointer:number)=>{opponentPath=await loadNativeOpponentPreparation(files,d,framePointer,'mcga',selectedData.physicsEngine);};
 await loadNativeReplay({memory,
  pauseAudio:()=>services.writeAudio(runtime.audio.produce()),
  selectReplay:()=>services.selectReplay(memory),prepareLoad:services.showWaiting,
  readReplay:async()=>{
   const rate=resolveReplayCadence(services.replayFramesPerSecond?.()),engine=resolvePhysicsEngine(services.replayPhysicsEngine?.());
   if(rate===10&&!(data.experimental10Hz===true&&engine==='ms-1991'))throw Error('10 Hz replay loading requires cadence-aware session and allocation support');
   selectedData=versionedRouteTables({...data,physicsEngine:engine,framesPerSecond:rate});
   if(!hasReplayCheckpointCapacity(memory(),d,rate,'mcga',engine)){
    growingCheckpoints=true;
    // Grow below freshly loaded graphics, not above the old resident banks.
    // Otherwise the larger retained bank pins holes left by their cleanup.
    await freeCompleteNativeRaceResourcesAsync({memory,writeMemory,stopEffect:handle=>services.writeAudio(runtime.audio.stopEffect(handle))},d,0x209e0);
    releasedForGrowth=true;
    const next=growReplayCheckpoints(memory(),d,rate,engine);
    const status=await loadNativeCatalogReplay(next,d,{read:services.readReplay},0x98,0xea,0xee8a);
    if(status&255)throw Error('Replay replacement failed before checkpoint commit');
    writeMemory(next);
    return status;
   }
   return loadNativeCatalogReplay(memory(),d,{read:services.readReplay},0x98,0xea,0xee8a);
  },
  analyzeTrack(){raw=Array.from(memory().slice(runtime.trackAddress,runtime.trackAddress+1802));const route=analyzeRoute(raw,selectedData.records,selectedData.vectors,selectedData.samples,selectedData.objects,undefined,{sample:false});const result=route.route&&!route.route.error&&route.route.count>520?analyzeAllocatedDisplayTrackAtFrame(memory(),d,'mcga',0xee8e,raw,selectedData.records,selectedData.vectors,selectedData.samples,selectedData.objects):analyzeAllocatedTrack(memory(),d,raw,selectedData.records,selectedData.vectors,selectedData.samples,selectedData.objects);raw=result.raw;writeMemory(result.memory);},
  async refreshOpponent(){services.progress(2);await prepareOpponent(0xee8e);},
  forceReloadCarResources:()=>releasedForGrowth,
  releaseCarResources:async()=>{if(!releasedForGrowth)await freeCompleteNativeRaceResourcesAsync({memory,writeMemory,stopEffect:handle=>services.writeAudio(runtime.audio.stopEffect(handle))},d,0x209e0);},
  async loadCarResources(){opponentPath=null;if(await initializeNativeRaceResources({...files,physicsEngine:selectedData.physicsEngine,progress:services.progress,prepareOpponent},d,0xee8e))throw Error('Original replay ran out of resource memory');},
  initialize(){applyVersionedCockpitMetadata(memory(),d,'mcga',selectedData.physicsEngine);replacement=createLoadedNativeManualRaceRuntime(selectedData,{memory:memory(),raw,trackAddress:runtime.trackAddress,initialWrites:[],opponentPath});},
 },d).catch(error=>{if(growingCheckpoints&&growthRollback)writeMemory(growthRollback);throw error;});
 return replacement;
}
