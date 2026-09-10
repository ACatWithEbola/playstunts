/** Original236aa..23728: move this resident block down across preceding
 * empty descriptors. Other resident allocations are not moved. */
export function compactResidentResource(before:Uint8Array,d:number,segment:number){
 const memory=before.slice(),view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const word=(at:number)=>view.getUint16(d+(at&65535),true),put=(at:number,value:number)=>view.setUint16(d+(at&65535),value&65535,true);
 const first=word(0x4b12),last=word(0x4b14);let source=last;
 for(let guard=0;;guard++){
  if(source===first)return {memory,error:'missing' as const,segment:0,offset:0};
  if(word(source+14)===(segment&65535))break;
  if(guard>=3641)throw Error('Original resident chain is not bounded');source=(source-18)&65535;
 }
 let destination=(source-18)&65535;
 if(word(destination+16)!==0)return {memory,error:null,segment:word(source+14),offset:0};
 for(let guard=0;word(destination+16)===0;guard++){
  if(guard>=3641)throw Error('Original resident chain has no sentinel');destination=(destination-18)&65535;
 }
 put(source+16,0);const pages=word(source+12),from=word(source+14)*16,next=(word(destination+14)+word(destination+12))&65535;
 destination=(destination+18)&65535;if(source===last)put(0x4b14,destination);
 put(destination+14,next);put(destination+12,pages);put(destination+16,2);
 for(let i=0;i<12;i++)memory[d+((destination+i)&65535)]=memory[d+((source+i)&65535)];
 const to=next*16,size=pages*16;if(from+size>memory.length||to+size>memory.length)throw Error('Original resident copy is outside memory');
 for(let i=0;i<size;i+=2)view.setUint16(to+i,view.getUint16(from+i,true),true);
 return {memory,error:null,segment:next,offset:0};
}
