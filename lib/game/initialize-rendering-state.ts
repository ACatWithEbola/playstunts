import {intSin,intCos} from '../physics/math.ts';
/** Original1697F and18100: four retained quarter-turn matrices and the
 * sign-extended diagonal projection constants. No captured frame is needed. */
export function initializeOriginalRenderingState(memory:Uint8Array,d:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const low={mcga:0,cga:0x5da,tandy:0x616,ega:0x462}[mode],v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 for(const [base,angle] of [[0x5ef8,0],[0x5558,256],[0x5546,512],[0x5572,768]]){
  const sin=intSin(angle),cos=intCos(angle),matrix=[cos,0,-sin,0,16384,0,sin,0,cos];
  matrix.forEach((value,index)=>v.setInt16(d+base+low+index*2,value,true));
 }
 for(const [at,value] of [[0x5f42,intSin(128)],[0x5f3e,intCos(128)],[0x5f4a,intSin(128)],[0x5f46,intCos(128)]])v.setInt32(d+at+low,value,true);
}
/** Original169C4 stores caller-owned material table addresses unchanged. */
export function initializeOriginalRenderingMaterials(memory:Uint8Array,d:number,materials:readonly [number,number,number,number,number],mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode],v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 [0x9c44,0x9fe8,0xa32e,0xa3a2,0xa00e].forEach((at,index)=>v.setUint16(d+at+high,materials[index]&65535,true));
}
/** Original outer startup selects the four pointers from its driver table,
 * then passes a zero fifth material pointer to169C4. Table contents are already
 * original addresses and must not receive another display-layout displacement. */
export function initializeOriginalDefaultRenderingMaterials(memory:Uint8Array,d:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const table={mcga:0x51ca,cga:0x51ca,tandy:0x52ce,ega:0x52cc}[mode],v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 initializeOriginalRenderingMaterials(memory,d,[v.getUint16(d+table,true),v.getUint16(d+table+2,true),v.getUint16(d+table+4,true),v.getUint16(d+table+6,true),0],mode);
}
