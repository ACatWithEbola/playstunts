import {createNativeDisplayCommonState,type NativeInitialDisplayData} from './native-display-common-state.ts';
import {allocateOriginalReplayCheckpoints} from './allocate-replay-checkpoints.ts';
import {analyzeRoute} from '../physics/route-analysis.ts';
import {analyzeAllocatedDisplayTrack,analyzeAllocatedDisplayTrackAtFrame} from './analyze-allocated-track.ts';
import {initializeNativeRaceResources} from './initialize-race-resources.ts';
import {loadNativeOpponentPreparation} from './load-opponent-preparation.ts';
import {createNativeDisplayRaceRenderer} from './native-display-race-renderer.ts';
import type {NativeDemoData} from './native-demo-runtime.ts';

/** Prepare an independent display resource graph for an already selected native
 * race. Geometry, fonts, cockpit banks and route buffers are loaded natively;
 * simulation state and sound output remain owned by the live race. */
export async function prepareNativeDisplayRace(data:Pick<NativeDemoData,'catalog'|'records'|'vectors'|'samples'|'objects'|'planes'>,mode:'cga'|'tandy'|'ega',source:NativeInitialDisplayData,live:Uint8Array,raw:number[],progress:(stage:number)=>void=()=>{}){
 if(raw.length!==1802||live.length!==0x100000)throw Error('Original display race requires complete track and simulation memory');
 const owner=await createNativeDisplayCommonState(mode,source,data.catalog),d=owner.d,liveD=0x2d1a0,high={cga:0x5e0,tandy:0x620,ega:0x45c}[mode],middle=mode==='ega'?0x460:high;
 const checkpoints=allocateOriginalReplayCheckpoints(owner.memory(),d,mode);
 if(checkpoints.error)throw Error('Original display replay allocation failed: '+checkpoints.error);owner.writeMemory(checkpoints.memory);
 let memory=owner.memory();const v=new DataView(memory.buffer);
 memory.set(live.subarray(liveD+0x8fc2,liveD+0x8fda),d+0x8fc2+high);
 memory[d+0x90f8+high]=live[liveD+0x90f8];memory[d+0xaa6e+high]=live[liveD+0xaa6e];
 memory.set(live.subarray(liveD+0x7460,liveD+0x7463),d+0x7460+middle);
 const track=v.getUint16(d+0x9356+high,true)+v.getUint16(d+0x9358+high,true)*16;memory.set(raw,track);
 const route=analyzeRoute(raw,data.records,data.vectors,data.samples,data.objects,undefined,{sample:false});
 const analyzed=route.route&&!route.route.error&&route.route.count>520?analyzeAllocatedDisplayTrackAtFrame(memory,d,mode,0xeee2,raw,data.records,data.vectors,data.samples,data.objects):analyzeAllocatedDisplayTrack(memory,d,mode,raw,data.records,data.vectors,data.samples,data.objects);owner.writeMemory(analyzed.memory);
 const name=(offset:number)=>{let result='';for(let i=0;i<65536;i++){const byte=owner.memory()[d+((offset+i)&65535)];if(!byte)return result;result+=String.fromCharCode(byte);}throw Error('Original display filename is unterminated');};
 const files={memory:owner.memory,writeMemory:owner.writeMemory,async exists(offset:number){return data.catalog.exists(name(offset));},async readFile(offset:number){return data.catalog.read(name(offset));},async retry(){throw Error('Original display race resource is missing');}};
 const result=await initializeNativeRaceResources({...files,progress,async prepareOpponent(bp){await loadNativeOpponentPreparation(files,d,bp,mode);}},d,0xeefe,{mode,drawing:owner.drawing});
 if(result!==0)throw Error('Original display race resource startup failed');
 return {owner,renderer:createNativeDisplayRaceRenderer(owner,raw,data.objects,data.planes)};
}
