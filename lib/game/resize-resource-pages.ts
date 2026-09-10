/** Supplied original 2361a..236a9; only the newest resident block may expand. */
export function resizeResourcePages(before:Uint8Array,dataSegment:number,segment:number,pages:number){
 if(dataSegment<0||dataSegment+65536>before.length)throw Error('Original allocator data segment is outside memory');
 const memory=before.slice(),v=new DataView(memory.buffer),at=(off:number)=>dataSegment+(off&65535),word=(off:number)=>v.getUint16(at(off),true),set=(off:number,n:number)=>v.setUint16(at(off),n,true);
 const first=word(0x4b12),last=word(0x4b14),terminal=word(0x4b18);let descriptor=last;pages&=65535;segment&=65535;
 for(let guard=0;;guard++){
  if(descriptor===first)return {memory,error:'missing' as const};
  if(word(descriptor+14)===segment)break;
  if(guard>=3641)throw Error('Original resource descriptor chain is not bounded');
  descriptor=(descriptor-18)&65535;
 }
 if(pages<=word(descriptor+12)){set(descriptor+12,pages);return {memory,error:null};}
 if(descriptor!==last)return {memory,error:'not-last' as const};
 set(descriptor+12,pages);const end=(segment+pages)&65535;let cached=word(0x4b16);
 if(end>=word(0x4788))set(0x4788,end);
 for(let guard=0;end>word(cached+14);guard++){
  if(cached===terminal)return {memory,error:'space' as const};
  if(guard>=3641)throw Error('Original resource descriptor chain is not bounded');
  set(cached+16,0);cached=(cached+18)&65535;set(0x4b16,cached);
 }
 return {memory,error:null};
}
