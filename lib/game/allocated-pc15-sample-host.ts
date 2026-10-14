import {loadedPc15Generation} from './loaded-pc15-generation.ts';
import {readPc15SampleResource} from './read-pc15-sample-resource.ts';
import {stepOriginalPcSpeakerSample,type OriginalPcSpeakerSampleResult} from './pc-speaker-sample.ts';
import type {PcSpeakerNoteSampleHost} from './pc-speaker-note-start.ts';
/** Explicit virtual interrupt host; never executes a stored DOS far pointer. */
export function createAllocatedPc15SampleHost(memory:()=>Uint8Array,d:number,driverSegment:number,ports:{port61():number;interruptMask():number},ordinary:(vector:{offset:number;segment:number})=>number[][]){
 const physicsEngine=loadedPc15Generation(memory(),d),driverBytes=physicsEngine==='ms-1991'?0x2e9:0x2df;
 if(!Number.isInteger(driverSegment)||driverSegment<0||driverSegment>65535||driverSegment*16+driverBytes>memory().length)throw Error('PC15 sample driver outside memory');
 const vector=()=>{const m=memory(),v=new DataView(m.buffer,m.byteOffset,m.byteLength);return {offset:v.getUint16(0x20,true),segment:v.getUint16(0x22,true)};};
 let output:number[][]=[];
 const emit=(result:OriginalPcSpeakerSampleResult&{installVector?:{offset:number;segment:number}})=>{
  const next=result.installVector??result.restoreVector;
  if(next){const m=memory(),v=new DataView(m.buffer,m.byteOffset,m.byteLength);v.setUint16(0x20,next.offset,true);v.setUint16(0x22,next.segment,true);}
  output.push(...result.writes);
 };
 const noteHost:PcSpeakerNoteSampleHost={physicsEngine,resolve(instrument){return {driverSegment,port61:ports.port61(),interruptMask:ports.interruptMask(),irqVector:vector(),sample:readPc15SampleResource(memory(),instrument)};},emit};
 const takeWrites=()=>{const writes=output;output=[];return writes;};
 return {noteHost,takeWrites,interrupt(){
  const current=vector();
  if(current.segment!==driverSegment||current.offset!==(physicsEngine==='ms-1991'?0x701:0x6dc))return ordinary(current);
  const m=memory(),driver=m.slice(driverSegment*16,driverSegment*16+driverBytes);
  const result=stepOriginalPcSpeakerSample(driver,ports.port61(),(offset,segment)=>{const at=segment*16+offset;if(at>=memory().length)throw Error('PC15 sample byte outside memory');return memory()[at];},physicsEngine);
  m.set(driver,driverSegment*16);emit(result);
  const writes=takeWrites();
  if(result.chainVector)writes.push(...ordinary(result.chainVector));
  return writes;
 }};
}
