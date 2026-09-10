/** Original22264: use the first zero segment, then clear the next segment.
 * The offset of an empty slot is ignored; duplicate callbacks are allowed. */
export function addOriginalTimerCallback(memory:Uint8Array,d:number,offset:number,segment:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 for(let i=0;i<5;i++){
  const at=d+0x4092+i*4;if(v.getUint16(at+2,true))continue;
  v.setUint16(at,offset&65535,true);v.setUint16(at+2,0,true);v.setUint16(at+2,segment&65535,true);v.setUint16(at+6,0,true);return;
 }
 throw Error('Original timer callback table is full');
}
