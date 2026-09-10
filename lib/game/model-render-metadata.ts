/** Supplied 16ABA..16B3F. Decode segmented descriptor fields and clamp paint
 * against the original unsigned byte count while retaining signed count use.
 */
export function originalModelRenderMetadata(memory:Uint8Array,d:number,recordPointer:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(o:number)=>v.getUint16(d+(o&65535),true),byte=(o:number)=>memory[d+(o&65535)];
 const model=word(recordPointer+6),paintCountByte=byte(model+8),requestedPaint=byte(recordPointer+19);
 const far=(o:number)=>[word(o),word(o+2)];
 return {vertexCount:word(model),vertices:far(model+2),primitives:far(model+10),includeMasks:far(model+14),excludeMasks:far(model+18),paintCount:paintCountByte<<24>>24,paint:requestedPaint<paintCountByte?requestedPaint:0,flags:byte(recordPointer+18),region:word(recordPointer+8)};
}
