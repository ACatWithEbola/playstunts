import {allocateResourcePages} from './allocate-resource-pages.ts';
import {releaseResourcePages} from './release-resource-pages.ts';
import {writeAnalyzedTrackMemory} from './write-analyzed-track-memory.ts';
import {analyzeRoute} from '../physics/route-analysis.ts';
/** Original124DE successful analysis, including the temporary 64-branch bank
 * and its retained discarded bytes. Invalid-track UI is caller-owned. */
export function analyzeAllocatedTrack(before:Uint8Array,d:number,raw:number[],...tables:Parameters<typeof analyzeRoute> extends [number[],infer A,infer B,infer C,infer D,...unknown[]]?[A,B,C,D]:never){return analyzeAllocatedDisplayTrack(before,d,'mcga',raw,...tables);}
/** Original analysis writes to the selected driver's allocated route buffers. */
export function analyzeAllocatedDisplayTrack(before:Uint8Array,d:number,mode:'mcga'|'cga'|'tandy'|'ega',raw:number[],...tables:Parameters<typeof analyzeRoute> extends [number[],infer A,infer B,infer C,infer D,...unknown[]]?[A,B,C,D]:never){
 return analyzeAllocatedTrackFrame(before,d,mode,undefined,raw,...tables);
}
/** Deferred sampling uses the actual original caller frame, including retained traversal bytes. */
export function analyzeAllocatedDisplayTrackAtFrame(before:Uint8Array,d:number,mode:'mcga'|'cga'|'tandy'|'ega',frame:number,raw:number[],...tables:Parameters<typeof analyzeRoute> extends [number[],infer A,infer B,infer C,infer D,...unknown[]]?[A,B,C,D]:never){return analyzeAllocatedTrackFrame(before,d,mode,frame,raw,...tables);}
function analyzeAllocatedTrackFrame(before:Uint8Array,d:number,mode:'mcga'|'cga'|'tandy'|'ega',frame:number|undefined,raw:number[],...tables:Parameters<typeof analyzeRoute> extends [number[],infer A,infer B,infer C,infer D,...unknown[]]?[A,B,C,D]:never){
 const allocated=allocateResourcePages(before,d,0x2f28,0x39);
 if(allocated.error)throw Error('Original track analysis allocation failed: '+allocated.error);
 const temporary=allocated.segment*16+allocated.offset;
 const analysis=analyzeRoute(raw,...tables,(index,bytes)=>allocated.memory.set(bytes,temporary+index*14),frame===undefined?undefined:{sample:false});
 const prepared=writeAnalyzedTrackMemory(allocated.memory,d,raw,analysis,mode,frame),m=prepared.memory,v=new DataView(m.buffer);
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode];
 // The source initializes 901 cells; the metadata collector owns 900 grid cells.
 m[v.getUint16(d+0xa466+high,true)+v.getUint16(d+0xa468+high,true)*16+900]=255;
 const freed=releaseResourcePages(m,d,allocated.segment);
 if(freed.error)throw Error('Original track analysis release failed: '+freed.error);
 return {...prepared,memory:freed.memory};
}
