/** Original 9640..96b0: read recorded input and capture a checkpoint every 600 frames.
 * The memory image must contain the current original-format race state.
 */
export function beginReplayFrame(before:Uint8Array,dataSegment:number){
 const memory=before.slice(),v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),at=(offset:number)=>dataSegment+offset;
 if(dataSegment<0||at(65536)>memory.length)throw Error('Original data segment is outside memory');
 const frame=v.getUint16(at(0x8c26),true),inputOffset=v.getUint16(at(0x9c40),true),inputSegment=v.getUint16(at(0x9c42),true);
 const inputAddress=inputSegment*16+((inputOffset+frame)&65535);
 if(inputAddress>=memory.length)throw Error('Original replay input is outside memory');
 const input=memory[inputAddress];if(input)memory[at(0x8eab)]=1;
 let checkpoint:number|null=null;
 if(frame%600===0){
  checkpoint=frame/600;
  memory.set(memory.subarray(at(0x9f5c),at(0x9f62)),at(0x8ea4));
  const offset=v.getUint16(at(0xa030),true)+checkpoint*0x430;
  const segment=(v.getUint16(at(0xa032),true)+((offset>>>16)<<12))&65535;
  // The original normalizes the starting pointer, then DI wraps within ES during REP MOVSW.
  for(let i=0;i<0x430;i+=2){
   const address=segment*16+((offset+i)&65535);
   if(address+2>memory.length)throw Error('Original replay checkpoint is outside memory');
   v.setUint16(address,v.getUint16(at(0x8ae6+i),true),true);
  }
 }
 return {memory,input,checkpoint,active:memory[at(0x8eab)]};
}
