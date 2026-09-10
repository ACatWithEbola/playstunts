import {allocateRawCarAudio} from './allocate-raw-car-audio.ts';
export interface NativeAudioBank {offset:number;segment:number;length:number}
/** Join original19066 sound resolution/allocation to retained race memory.
 * Bank lengths come from the caller's loaded resources, including padding. */
export function allocateOriginalCarAudioMemory(memory:Uint8Array,d:number,descriptor:{offset:number;segment:number},sounds:NativeAudioBank,voices:NativeAudioBank,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const low={mcga:0,cga:0x5da,tandy:0x616,ega:0x462}[mode],high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode],middle=mode==='ega'?0x460:high;
 // EGA's CHHT pointer is843A (original2E933), after the track-coordinate
 // table. Its displacement follows the middle region, like BASD.
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),percussionAddresses=[0x70e4,0x7ff0,0x7ffc,0x9ade,0x897e,0x7fda,0x89ba].map(at=>at+(at===0x70e4||at===0x7fda?middle:high));
 const bank=(p:NativeAudioBank)=>{const start=p.segment*16+p.offset;if(p.length<6||start+p.length>memory.length)throw Error('Original audio bank is outside memory');return memory.slice(start,start+p.length);};
 const before={cars:Array.from({length:25},(_,i)=>memory.slice(d+0x618e+low+i*76,d+0x618e+low+(i+1)*76)),timers:Array.from({length:24},(_,i)=>memory.slice(d+0x801e+high+i*72,d+0x801e+high+(i+1)*72)),busy:Array.from(memory.subarray(d+0xa3aa+high,d+0xa3aa+high+24))};
 if(before.cars.every(record=>record[0]!==0))throw Error('Original car audio table exhausted');
 const descriptorAt=descriptor.segment*16+descriptor.offset;
 const result=allocateRawCarAudio(before,memory.slice(descriptorAt,descriptorAt+48),pointer=>{
  const start=pointer.segment*16+pointer.offset,name=memory.slice(start,start+4);
  memory.set(name,d+0x68fc+low);memory[d+0x6900+low]=0;for(let i=0;i<4;i++)if(!memory[d+0x68fc+low+i])memory[d+0x68fc+low+i]=32;
  return name;
 },{bank:bank(sounds),voices:bank(voices),bankAddress:sounds,voiceAddress:voices,percussion:percussionAddresses.map(at=>({offset:v.getUint16(d+at,true),segment:v.getUint16(d+at+2,true)}))});
 result.cars.forEach((bytes,i)=>memory.set(bytes,d+0x618e+low+i*76));result.timers.forEach((bytes,i)=>memory.set(bytes,d+0x801e+high+i*72));memory.set(result.busy,d+0xa3aa+high);memory.set(result.bank,sounds.segment*16+sounds.offset);
 result.percussion.forEach((pointer,i)=>{const at=d+percussionAddresses[i];v.setUint16(at,pointer.offset,true);v.setUint16(at+2,pointer.segment,true);});
 return result.handle;
}
