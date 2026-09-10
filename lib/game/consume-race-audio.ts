import {stepAudioSampleQueue} from './audio-sample-queue.ts';
import type {Vector} from '../physics/math.ts';
export interface RaceAudioTarget {handle:number;rpm:number;previous:Vector;current:Vector;interval:number}
/** Decode the aac0 arguments without advancing the queue or its timer. */
export function readOriginalRaceAudioTargets(memory:Uint8Array,d:number,record:number,interval:number):RaceAudioTarget[]{
 if(!Number.isInteger(d)||d<0||d+65536>memory.length)throw Error('Original data segment is outside memory');
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const word=(offset:number)=>v.getUint16(d+(offset&65535),true);
 const vector=(offset:number)=>[0,1,2].map(a=>word(record+offset+a*2)<<16>>16) as Vector;
 const targets=[{handle:word(0x8016),rpm:word(record+30),previous:vector(6),current:vector(12),interval}];
 if(memory[d+0x8fc8])targets.push({handle:word(0x86de),rpm:word(record+32),previous:vector(18),current:vector(24),interval});
 return targets;
}
/** Original 14318 queue-consumer prefix and aac0 argument decoding.
 * Hardware/car callbacks precede this step. Remaining replay/input work in
 * 14318 is outside this consumer. Stack equality is explicit caller state.
 */
export function consumeRaceAudio(before:Uint8Array,dataSegment:number,stackMatches:boolean){
 if(!Number.isInteger(dataSegment)||dataSegment<0||dataSegment+65536>before.length)throw Error('Original data segment is outside memory');
 const memory=before.slice(),d=dataSegment,v=new DataView(memory.buffer);
 const word=(offset:number)=>v.getUint16(d+(offset&65535),true);
 const next=stepAudioSampleQueue({counter:word(0x8a46),read:word(0x9332),write:word(0x8ffc),busy:memory[d+0x8936],stackMatches});
 const targets:RaceAudioTarget[]=[];
 for(const event of next.events){
  const record=(0x955e+event.index*34)&65535;
  targets.push(...readOriginalRaceAudioTargets(memory,d,record,event.interval));
 }
 v.setUint16(d+0x8a46,next.counter,true);v.setUint16(d+0x9332,next.read,true);
 return {memory,targets};
}

/** Registered order: hardware/effects and car audio, then queued race samples.
 * The host retains the returned memory alongside its recorded race state.
 */
export function tickRaceAudioMemory(memory:Uint8Array,dataSegment:number,stackMatches:boolean,audio:{tick:()=>number[][];update:(handle:number,rpm:number,previous:Vector,current:Vector,interval:number)=>void}){
 const writes=audio.tick(),result=consumeRaceAudio(memory,dataSegment,stackMatches);
 for(const target of result.targets)audio.update(target.handle,target.rpm,target.previous,target.current,target.interval);
 return {...result,writes};
}
