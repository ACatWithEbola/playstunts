/** Original22298..222d6 removes the first matching far pointer and shifts
 * all remaining entries, including entries after an empty slot. */
export function removeOriginalTimerCallback(memory:Uint8Array,d:number,offset:number,segment:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);offset&=65535;segment&=65535;
 for(let index=0;index<5;index++){
  const at=d+0x4092+index*4;
  if(v.getUint16(at,true)!==offset||v.getUint16(at+2,true)!==segment)continue;
  for(let next=index;next<4;next++)v.setUint32(d+0x4092+next*4,v.getUint32(d+0x4096+next*4,true),true);
  v.setUint32(d+0x40a2,0,true);return;
 }
}
