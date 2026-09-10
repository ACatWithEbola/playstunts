/** Original main-loop 13B7D..13B9C, after simulation catches up with its timer. */
export function resetOriginalInactiveRaceClock(memory:Uint8Array,d:number){
 if(memory[d+0x8eab]||memory[d+0xa3c2])return false;
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 for(const offset of [0x73b2,0x8fd8,0x8c26])v.setUint16(d+offset,0,true);
 return true;
}
