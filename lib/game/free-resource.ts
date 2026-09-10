/** Supplied original 233f4..2349c: release a resident block, optionally copy it
 * into the high-end resource cache, then retreat past empty resident slots.
 */
export function freeResource(before:Uint8Array,dataSegment:number,offset:number,segment:number){
 if(dataSegment<0||dataSegment+65536>before.length)throw Error('Original allocator data segment is outside memory');
 const memory=before.slice(),v=new DataView(memory.buffer),at=(off:number)=>dataSegment+(off&65535),word=(off:number)=>v.getUint16(at(off),true),set=(off:number,n:number)=>v.setUint16(at(off),n,true);
 const first=word(0x4b12),last=word(0x4b14);let descriptor=last,cached=word(0x4b16),resultSegment=0;segment&=65535;offset&=65535;
 for(let guard=0;;guard++){
  if(descriptor===first)return {memory,error:'missing' as const,offset,segment:0};
  if(word(descriptor+14)===segment)break;
  if(guard>=3641)throw Error('Original resource descriptor chain is not bounded');descriptor=(descriptor-18)&65535;
 }
 set(descriptor+16,0);
 const pages=word(descriptor+12),gap=(word(cached+14)-word(last+14)-word(last+12))&65535;
 if(descriptor===last||(descriptor!==cached&&gap>=pages)){
  resultSegment=(word(cached+14)-pages)&65535;cached=(cached-18)&65535;set(0x4b16,cached);set(cached+14,resultSegment);set(cached+12,pages);set(cached+16,1);
  for(let i=0;i<12;i++)memory[at(cached+i)]=memory[at(descriptor+i)];
  const source=segment*16,target=resultSegment*16,size=pages*16;
  if(source+size>memory.length||target+size>memory.length)throw Error('Original cached resource is outside memory');
  // Original copies words backwards, including its behavior on overlapping ranges.
  for(let i=size-2;i>=0;i-=2)v.setUint16(target+i,v.getUint16(source+i,true),true);
 }
 if(descriptor===last){
  let guard=0;do{descriptor=(descriptor-18)&65535;if(guard++>=3641)throw Error('Original resident chain has no sentinel');}while(word(descriptor+16)===0);
  set(0x4b14,descriptor);
 }
 return {memory,error:null,offset,segment:resultSegment};
}
