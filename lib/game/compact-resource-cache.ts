/** Original 23275..232e0 packs live cached blocks toward the terminal block. */
export function compactResourceCache(before:Uint8Array,dataSegment:number){
 const memory=before.slice(),v=new DataView(memory.buffer),at=(off:number)=>dataSegment+(off&65535),word=(off:number)=>v.getUint16(at(off),true),set=(off:number,n:number)=>v.setUint16(at(off),n,true);
 let source=word(0x4b18),destination=source,holes=0;
 for(let guard=0;;guard++){
  if(guard>=3641)throw Error('Original cache descriptor chain is not bounded');
  if(!(word(source+16)&1))holes=(holes+word(source+12))&65535;
  else{
   if(holes){
    const pages=word(source+12),sourceSegment=word(source+14),segment=(word(destination+18+14)-pages)&65535;
    set(destination+12,pages);set(destination+14,segment);
    const flags=word(source+16);set(source+16,0);set(destination+16,flags);
    for(let i=0;i<12;i++)memory[at(destination+i)]=memory[at(source+i)];
    const from=sourceSegment*16,to=segment*16,size=pages*16;
    if(from+size>memory.length||to+size>memory.length)throw Error('Original cache copy is outside memory');
    for(let i=size-2;i>=0;i-=2)v.setUint16(to+i,v.getUint16(from+i,true),true);
   }
   destination=(destination-18)&65535;
  }
  source=(source-18)&65535;if(source<word(0x4b16))break;
 }
 set(0x4b16,destination+18);return memory;
}
