/** Original 0x8ff9..0x90e0. Preserve bytes outside the fields written by this stage. */
export function initializeCarFields(before:Uint8Array,tuning:Uint8Array){
 const out=before.slice(),state=new DataView(out.buffer,out.byteOffset,out.byteLength),sim=new DataView(tuning.buffer,tuning.byteOffset,tuning.byteLength);
 const word=(at:number,value:number)=>state.setUint16(at,value,true);
 for(const at of [0x36,0x1e,0x20,0x28,0x2a,0x2c,0x2e,0x3e,0x40,0x42,0x48,0x4a,0x44])word(at,0);
 for(const at of [0x22,0x24,0x26])word(at,sim.getUint16(6,true));
 const ratio=sim.getUint16(0x10,true);word(0x30,ratio);word(0x32,ratio>>>8);
 for(const at of [0x34,0x3a])word(at,sim.getUint16(0x20,true));
 for(const at of [0x38,0x3c])word(at,sim.getUint16(0x22,true));
 word(0x46,1000);
 out.set([0,0,1,2,2,4],0xa4);
 return out;
}
