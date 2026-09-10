import {adlibVolume} from './adlib-volume.ts';
/** Original 29668 calls 2a7d0 for each music owner, including inactive voices
 * retaining that owner. AD15's channel-zero volume callback does nothing. */
export function setOriginalAdlibMusicVolume(memory:Uint8Array,d:number,driverSegment:number,value:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),writes:number[][]=[];
 if(memory[d+0x4e06])throw Error('Music volume requires regular AdLib mode');
 const tracks=memory[d+0x88e2],count=memory[d+0x9fe4];
 if(tracks>24||count>10)throw Error('Original music volume exceeds the allocated audio tables');
 for(let owner=0;owner<tracks;owner++){
  memory[d+0x801e+owner*72+0x28]=value&255;
  for(let index=1;index<count;index++){
   const at=d+0xa036+index*46;if(memory[at]!==owner)continue;
   const instrument=v.getUint16(at+16,true)+v.getUint16(at+18,true)*16;
   if(instrument+100>memory.length)throw Error('Original music instrument is outside memory');
   writes.push(...adlibVolume(Array.from(memory.slice(instrument,instrument+100)),index-1,value&255,memory[driverSegment*16+0x957+index-1]));
  }
 }
 return writes;
}
