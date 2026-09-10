/** Original b3b2 cause4, player0. A crashed/finished player retains its
 * existing cause. Otherwise mark a replay request and snapshot race stats. */
export function requestOriginalRaceReplay(memory:Uint8Array,d:number){
 if(memory[d+0x8ce9])return;
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 v.setUint16(d+0x8c1e,1,true);v.setUint16(d+0x8c20,1,true);v.setUint16(d+0x8c2c,v.getUint16(d+0x8c26,true),true);
 if(memory[d+0x8eac]===0)memory[d+0x8eac]=4;
 if(!(memory[d+0x8018]&4))memory.set(memory.subarray(d+0x8c22,d+0x8c38),d+0x899a);
}
