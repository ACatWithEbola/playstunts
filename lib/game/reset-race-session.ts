/** Original race initializer prefix 9178..91c8, including 142b4 input/audio-queue reset.
 * Caller owns the original memory image and data-segment base.
 */
export function resetRaceSession(before:Uint8Array,dataSegment:number,mode:number){
 const out=before.slice(),v=new DataView(out.buffer,out.byteOffset,out.byteLength),at=(offset:number)=>dataSegment+offset;
 if(dataSegment<0||at(65536)>out.length)throw Error('Original data segment is outside memory');
 if((mode&65535)===65535){
  v.setUint16(at(0xa034),0,true);
  const checkpoints=v.getUint16(at(0xa030),true)+v.getUint16(at(0xa032),true)*16;
  for(let i=0;i<20;i++){
   const address=checkpoints+0x3c4+i*0x430;
   if(address>=out.length)throw Error('Original replay checkpoint is outside memory');
   out[address]=0;
  }
 }
 out[at(0x90a0)]=1;out[at(0x9b43)]=2;
 for(const offset of [0x73b2,0x93dc])v.setUint16(at(offset),0,true);
 for(const offset of [0x8ff4,0x7fee])out[at(offset)]=0;
 return out;
}
