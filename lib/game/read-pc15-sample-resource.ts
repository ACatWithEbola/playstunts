/** Original PC15 note-on follows instrument+6's far pointer, then the sample
 * header's length at+8. Both driver generations use this same resource ABI. */
export function readPc15SampleResource(memory:Uint8Array,instrument:Uint8Array){
 if(instrument.length<10)throw Error('PC15 sample instrument pointer is truncated');
 const v=new DataView(instrument.buffer,instrument.byteOffset,instrument.byteLength);
 const offset=v.getUint16(6,true),segment=v.getUint16(8,true),base=segment*16;
 if(!(offset|segment)||base+65536>memory.length)throw Error('PC15 sample segment is outside allocated memory');
 const length=memory[base+((offset+8)&65535)]|memory[base+((offset+9)&65535)]<<8;
 return {offset,segment,length};
}
