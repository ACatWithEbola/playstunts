/** Original resolved-descriptor car initialization at0x190c3..0x19306.
 * The caller supplies the original effect allocator's result and resolved patch.
 */
export function initializeCarAudio(before:Uint8Array,descriptor:Uint8Array,instrument:Uint8Array,timer:number){
 if(before.length!==76||descriptor.length!==48||instrument.length<16)throw Error('Invalid original car audio initialization data');
 if(!descriptor[6])throw Error('Car sound resources must be resolved before initialization');
 const out=before.slice(),v=new DataView(out.buffer);out.set(descriptor,28);
 v.setUint16(2,timer,true);out[1]=0;v.setUint16(4,0,true);v.setUint32(6,0,true);out[10]=0;
 if(!instrument[14])throw Error('Original car audio pitch divide fault');
 const rpm=new DataView(descriptor.buffer,descriptor.byteOffset,descriptor.byteLength).getUint16(0,true);
 v.setUint16(12,Math.floor(rpm/instrument[14])+(instrument[15]<<4),true);out[14]=255;
 for(const offset of [16,18,20,22])v.setUint16(offset,65535,true);
 v.setUint16(24,rpm,true);out[26]=0;out[27]=0;out[0]=1;
 return out;
}
