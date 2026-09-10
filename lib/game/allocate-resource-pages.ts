/** Supplied original 231c0..23273 resource allocation. Sizes are 16-byte paragraphs.
 * Failure retains the original partial descriptor changes for caller inspection.
 */
export function allocateResourcePages(before:Uint8Array,dataSegment:number,nameOffset:number,pages:number,retainedFrame?:{bp:number;di?:number}){
 if(dataSegment<0||dataSegment+65536>before.length)throw Error('Original allocator data segment is outside memory');
 const memory=before.slice(),v=new DataView(memory.buffer),at=(off:number)=>dataSegment+(off&65535),word=(off:number)=>v.getUint16(at(off),true),set=(off:number,n:number)=>v.setUint16(at(off),n,true);
 if(retainedFrame?.di!==undefined)set(retainedFrame.bp-4,retainedFrame.di);
 let descriptor=word(0x4b14),cached=word(0x4b16);const terminal=word(0x4b18),segment=(word(descriptor+14)+word(descriptor+12))&65535;
 descriptor=(descriptor+18)&65535;
 if(cached<=descriptor){if(cached===terminal)return {memory,error:'slots' as const,segment,offset:0,descriptor};cached=(cached+18)&65535;set(0x4b16,cached);}
 set(0x4b14,descriptor);
 // 231DE..231E1 calls the basename helper. Preserve only its proven stack
 // writes when a caller supplies this allocator's actual frame location.
 // Saved caller registers are written only when independently supplied.
 if(retainedFrame!==undefined){
  const retainedFrameBP=retainedFrame.bp;
  set(retainedFrameBP-14,cached);set(retainedFrameBP-12,retainedFrameBP);
  set(retainedFrameBP-10,0x2806);set(retainedFrameBP-8,0x209e);set(retainedFrameBP-6,nameOffset);
 }
 let name=nameOffset&65535,terminated=false;
 for(let i=0;i<65536;i++){const off=(nameOffset+i)&65535,byte=memory[at(off)];if(!byte){terminated=true;break;}if(byte===58||byte===92)name=(off+1)&65535;}
 if(!terminated)throw Error('Original allocation name has no terminator');
 for(let i=0;i<12;i++)memory[at(descriptor+i)]=memory[at(name+i)];
 cached=word(0x4b16);set(descriptor+14,segment);set(descriptor+12,pages);set(descriptor+16,2);
 const end=(segment+(pages&65535))&65535;if(end>=word(0x4788))set(0x4788,end);
 for(let guard=0;end>word(cached+14);guard++){
  if(cached===terminal)return {memory,error:'space' as const,segment,offset:0,descriptor};
  if(guard>=3641)throw Error('Original resource descriptor chain is not bounded');
  set(cached+16,0);cached=(cached+18)&65535;set(0x4b16,cached);
 }
 return {memory,error:null,segment,offset:0,descriptor};
}
