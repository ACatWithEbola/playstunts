export interface AudioFarPointer {offset:number;segment:number}
/** Original190e5..19286: resolve the engine plus eight effect names in order. */
export function resolveCarAudio(before:Uint8Array,nameAt:(pointer:AudioFarPointer)=>Uint8Array,resolve:(name:Uint8Array,kind:'instrument'|'effect')=>AudioFarPointer){
 if(before.length!==48)throw Error('Invalid original car audio descriptor');
 const descriptor=before.slice(),v=new DataView(descriptor.buffer);
 if(descriptor[6])return descriptor;
 for(const offset of [8,16,20,24,28,32,36,40,44]){
  const bytes=nameAt({offset:v.getUint16(offset,true),segment:v.getUint16(offset+2,true)});
  if(bytes.length<4)throw Error('Incomplete original sound resource name');
  const name=Uint8Array.from(bytes.slice(0,4),b=>b===0?32:b);
  const pointer=resolve(name,offset===8?'instrument':'effect');
  v.setUint16(offset,pointer.offset,true);v.setUint16(offset+2,pointer.segment,true);
 }
 descriptor[6]=1;return descriptor;
}
