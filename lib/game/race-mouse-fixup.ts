/** Original 157ce..1582e: correct the recorded steering bit after mouse
 * steering has been consumed. Both the ring index and bank offset wrap. */
export function fixOriginalMouseRecording(memory:Uint8Array,d:number):void {
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const frame=view.getUint16(d+0x8c26,true),index=frame&63;
 if(!memory[d+0x893c+index])return;
 const target=(memory[d+0x88e4+index]<<24>>24)*4;
 const steering=view.getInt16(d+0x8c58,true);
 const bit=steering>target?8:steering<target?4:0;
 if(bit){
  const address=view.getUint16(d+0x9c42,true)*16+((frame+view.getUint16(d+0x9c40,true))&65535);
  memory[address]|=bit;
 }
 memory[d+0x893c+index]=0;
}
