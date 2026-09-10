/** Original1B894: construct the 22-byte retained descriptor for a 3D shape.
 * Each read occurs in source order so overlapping source/destination survives. */
export function initializeOriginalShapeDescriptor(memory:Uint8Array,d:number,offset:number,segment:number,descriptor:number){
 const u=(n:number)=>n&65535,view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const word=(at:number)=>view.getUint16(d+u(descriptor+at),true),set=(at:number,value:number)=>view.setUint16(d+u(descriptor+at),u(value),true);
 set(0,memory[(segment&65535)*16+u(offset)]);
 set(6,memory[(segment&65535)*16+u(offset+1)]);
 memory[d+u(descriptor+8)]=memory[(segment&65535)*16+u(offset+2)];
 set(2,offset+4);set(4,segment);
 set(14,offset+4+word(0)*6);set(16,segment);
 set(18,offset+4+word(0)*6+word(6)*4);set(20,segment);
 set(10,offset+4+word(0)*6+word(6)*8);set(12,segment);
}
