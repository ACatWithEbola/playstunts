import {loadNativeReplay} from './native-replay-load.ts';
import {loadNativeCatalogReplay} from './load-catalog-replay.ts';
import {loadNativeOpponentPreparation} from './load-opponent-preparation.ts';
import {freeCompleteNativeRaceResources} from './complete-race-resource-cleanup.ts';
import {initializeNativeRaceResources} from './initialize-race-resources.ts';
import {analyzeRoute} from '../physics/route-analysis.ts';
import {analyzeAllocatedTrack,analyzeAllocatedDisplayTrackAtFrame} from './analyze-allocated-track.ts';
import {createLoadedNativeManualRaceRuntime,type createNativeManualRaceRuntime} from './native-manual-race-runtime.ts';
import type {NativeDemoData} from './native-demo-runtime.ts';
type Runtime=Awaited<ReturnType<typeof createNativeManualRaceRuntime>>;
export interface AllocatedReplayLoadServices {
 /** The original file dialog edits DS0098 (directory) and DS00EA (name). */
 selectReplay(memory:()=>Uint8Array):Promise<number>;
 readReplay(name:string):Promise<Uint8Array|null>;
 showWaiting():void;
 progress(stage:number):void;
 writeAudio(writes:number[][]):void;
}
/** Original161EA load branch, retaining the outer recording/checkpoint graph.
 * Resource calls use the replay controller's actual nested stack frames. */
export async function loadAllocatedReplay(data:NativeDemoData,runtime:Runtime,services:AllocatedReplayLoadServices):Promise<Runtime|undefined>{
 const d=0x2d1a0,memory=()=>runtime.session.state.memory;
 const writeMemory=(next:Uint8Array)=>runtime.session.originalMemory.writeMemory(next);
 let raw=runtime.raw,opponentPath=runtime.opponentPath,replacement:Runtime|undefined;
 const filename=(at:number)=>{let name='';for(let i=0;i<65536;i++){const byte=memory()[d+((at+i)&65535)];if(!byte)return name;name+=String.fromCharCode(byte);}throw Error('Unterminated original resource filename');};
 const files={memory,writeMemory,async exists(at:number){return data.catalog.exists(filename(at));},async readFile(at:number){return data.catalog.read(filename(at));},async retry(){throw Error('Original replay resource could not load');}};
 const prepareOpponent=async(framePointer:number)=>{opponentPath=await loadNativeOpponentPreparation(files,d,framePointer);};
 await loadNativeReplay({memory,
  pauseAudio:()=>services.writeAudio(runtime.audio.produce()),
  selectReplay:()=>services.selectReplay(memory),prepareLoad:services.showWaiting,
  readReplay:()=>loadNativeCatalogReplay(memory(),d,{read:services.readReplay},0x98,0xea,0xee8a),
  analyzeTrack(){raw=Array.from(memory().slice(runtime.trackAddress,runtime.trackAddress+1802));const route=analyzeRoute(raw,data.records,data.vectors,data.samples,data.objects,undefined,{sample:false});const result=route.route&&!route.route.error&&route.route.count>520?analyzeAllocatedDisplayTrackAtFrame(memory(),d,'mcga',0xee8e,raw,data.records,data.vectors,data.samples,data.objects):analyzeAllocatedTrack(memory(),d,raw,data.records,data.vectors,data.samples,data.objects);raw=result.raw;writeMemory(result.memory);},
  async refreshOpponent(){services.progress(2);await prepareOpponent(0xee8e);},
  releaseCarResources:()=>freeCompleteNativeRaceResources({memory,writeMemory,stopEffect:handle=>services.writeAudio(runtime.audio.stopEffect(handle))},d,0x209e0),
  async loadCarResources(){opponentPath=null;if(await initializeNativeRaceResources({...files,progress:services.progress,prepareOpponent},d,0xee8e))throw Error('Original replay ran out of resource memory');},
  initialize(){replacement=createLoadedNativeManualRaceRuntime(data,{memory:memory(),raw,trackAddress:runtime.trackAddress,initialWrites:[],opponentPath});},
 },d);
 return replacement;
}
