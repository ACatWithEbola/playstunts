import type {Shape} from './types.ts';
import {originalStartTruckSubmission} from './start-truck-submission.ts';
/** Adapt the source submission for a modern renderer without changing geometry.
 * Scratch contains original render resources and is independent of race memory.
 */
export function originalStartTruckVisual(scratch:Uint8Array,live:Uint8Array,d:number,shape:Shape){
 for(const [first,last] of [[0x8eab,0x8eac],[0x8fba,0x8fbe],[0x93dc,0x93de],[0x9b2a,0x9b2c],[0xa3e2,0xa41e],[0xa796,0xa7d2]])scratch.set(live.subarray(d+first,d+last),d+first);
 const tile=[scratch[d+0x8fba],scratch[d+0x8fbc]];
 const submission=originalStartTruckSubmission(scratch,d,tile,tile,[0,0,0],0);
 if(!submission)return null;
 const record=Uint8Array.from(submission.record),v=new DataView(record.buffer),memory=new DataView(scratch.buffer,scratch.byteOffset,scratch.byteLength);
 const base=memory.getUint16(d+0x7dfc,true)*16,offset=memory.getUint16(d+0x7dfa,true);
 const vertices=shape.vertices.map((vertex,i)=>i<8||i>11?vertex.slice():[0,1,2].map(a=>memory.getInt16(base+((offset+i*6+a*2)&65535),true)));
 return {shape:{...shape,vertices},position:[0,1,2].map(a=>v.getInt16(a*2,true)),heading:v.getInt16(14,true),paint:record[19]};
}
