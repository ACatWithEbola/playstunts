/** Original235b9..235f3: discard a resident allocation without caching it. */
export function releaseResourcePages(before:Uint8Array,d:number,segment:number){
 const memory=before.slice(),view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const word=(at:number)=>view.getUint16(d+(at&65535),true),put=(at:number,value:number)=>view.setUint16(d+(at&65535),value,true);
 const first=word(0x4b12),last=word(0x4b14);let descriptor=last;
 for(let guard=0;;guard++){
  if(descriptor===first)return {memory,error:'missing' as const};
  if(word(descriptor+14)===(segment&65535))break;
  if(guard>=3641)throw Error('Original resource descriptor chain is not bounded');descriptor=(descriptor-18)&65535;
 }
 put(descriptor+16,0);
 if(descriptor===last){
  let guard=0;do{descriptor=(descriptor-18)&65535;if(guard++>=3641)throw Error('Original resident chain has no sentinel');}while(word(descriptor+16)===0);
  put(0x4b14,descriptor);
 }
 return {memory,error:null};
}
