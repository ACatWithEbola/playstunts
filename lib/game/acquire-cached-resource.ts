import {compactResourceCache} from './compact-resource-cache.ts';
/** Original 232e2..233a0: case-sensitive basename lookup, cached-to-resident
 * forward word copy, eviction, and cache compaction. A zero-flag descriptor
 * ends the search immediately, including the original early-miss behavior.
 */
export function acquireCachedResource(before:Uint8Array,dataSegment:number,nameOffset:number){
 const memory=before.slice(),v=new DataView(memory.buffer),at=(off:number)=>dataSegment+(off&65535),word=(off:number)=>v.getUint16(at(off),true),set=(off:number,n:number)=>v.setUint16(at(off),n,true);
 let name=nameOffset&65535,terminated=false;
 for(let i=0;i<65536;i++){const off=(nameOffset+i)&65535,byte=memory[at(off)];if(!byte){terminated=true;break;}if(byte===58||byte===92)name=(off+1)&65535;}
 if(!terminated)throw Error('Original resource name has no terminator');
 let source=word(0x4b16);const terminal=word(0x4b18);
 for(let guard=0;;guard++){
  if(!word(source+16))return {memory,found:false,segment:0,offset:0};
  let match=true;
  for(let i=0;i<12;i++){
   const requested=memory[at(name+i)],stored=memory[at(source+i)];
   if(!requested){match=stored===0||stored===46;break;}
   if(requested!==stored){match=false;break;}
  }
  if(match)break;
  source=(source+18)&65535;
  if(source>=terminal)return {memory,found:false,segment:0,offset:0};
  if(guard>=3641)throw Error('Original cache search is not bounded');
 }
 let destination=word(0x4b14);const segment=(word(destination+14)+word(destination+12))&65535,pages=word(source+12),sourceSegment=word(source+14);
 destination=(destination+18)&65535;set(0x4b14,destination);set(source+16,0);set(destination+14,segment);set(destination+12,pages);set(destination+16,2);
 for(let i=0;i<12;i++)memory[at(destination+i)]=memory[at(source+i)];
 if(destination===word(0x4b16))set(0x4b16,word(0x4b16)+18);
 const from=sourceSegment*16,to=segment*16,size=pages*16;
 if(from+size>memory.length||to+size>memory.length)throw Error('Original cached resource is outside memory');
 for(let i=0;i<size;i+=2)v.setUint16(to+i,v.getUint16(from+i,true),true);
 let cached=word(0x4b16);const end=(segment+pages)&65535;
 for(let guard=0;end>word(cached+14);guard++){
  if(guard>=3641)throw Error('Original cache eviction is not bounded');set(cached+16,0);cached=(cached+18)&65535;set(0x4b16,cached);
 }
 return {memory:compactResourceCache(memory,dataSegment),found:true,segment,offset:0};
}
