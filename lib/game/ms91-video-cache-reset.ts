/** Original MS91 image c4ba..c517. This is the rectangle-cache reset only,
 * not the complete slow-video presentation policy. Caller owns active9690. */
export function resetMs91VideoCaches(memory:Uint8Array,d:number){
 if(d<0||d+65536>memory.length)throw Error('Original data segment is outside memory');
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 if(!view.getUint16(d+0x9690,true))return;
 const full=memory.slice(d+0x92a,d+0x932),empty=memory.slice(d+0x339a,d+0x33a2);
 for(const bank of [0xa250,0xa65e]){
  memory.set(full,d+bank);
  for(let index=1;index<15;index++)memory.set(empty,d+bank+index*8);
 }
}
