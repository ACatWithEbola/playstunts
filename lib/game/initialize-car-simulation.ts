/** Supplied BA7F..BAD7 / BB06..BB5E: copy the original 776-byte SIMD
 * record, install its owner's allocated table pointer, then fill 64 entries.
 * The executable divides signed products by 512 with truncation toward zero.
 */
export function initializeOriginalCarSimulation(memory:Uint8Array,d:number,simulation:Uint8Array,opponent=false,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 if(simulation.length!==776)throw Error('Original SIMD record must contain 776 bytes');
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode];
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),base=d+high+(opponent?0x9c52:0xa46a),pointer=d+high+(opponent?0x935e:0x9352);
 memory.set(simulation,base);memory.copyWithin(base+772,pointer,pointer+4);
 const offset=v.getUint16(pointer,true),segment=v.getUint16(pointer+2,true),resistance=v.getInt16(base+56,true);
 for(let i=0;i<64;i++){
  const address=(segment*16+((offset+i*2)&65535))&0xfffff,value=Math.trunc(resistance*i*i/512);
  memory[address]=value&255;memory[(address+1)&0xfffff]=(value>>8)&255;
 }
}
