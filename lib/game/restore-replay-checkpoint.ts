/** Original 9578..963f. Select/restore a checkpoint; subsequent playback advances to the requested frame. */
export function restoreReplayCheckpoint(before:Uint8Array,dataSegment:number,target:number,initialize:(memory:Uint8Array)=>Uint8Array){
 if(!Number.isInteger(target)||target<0||target>12000)throw Error('Replay target must be within the original 12000-frame recording');
 let memory=before.slice();
 if(dataSegment<0||dataSegment+65536>memory.length)throw Error('Original data segment is outside memory');
 let v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const at=(offset:number)=>dataSegment+offset;
 if(target===0&&v.getUint16(at(0xa034),true)===0){memory=initialize(memory).slice();v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);}
 let index=Math.trunc(target/600);if(index===20)index--;
 const current=v.getUint16(at(0x8c26),true);
 const address=(extra:number)=>{
  const offset=v.getUint16(at(0xa030),true)+index*0x430+extra;
  const segment=(v.getUint16(at(0xa032),true)+((offset>>>16)<<12))&65535;
  return {offset:offset&65535,segment};
 };
 if(target>=current){
  while(index*600>current){
   const p=address(0x3c4),a=p.segment*16+p.offset;
   if(a>=memory.length)throw Error('Original checkpoint marker is outside memory');
   if(memory[a]!==0)break;
   index--;
  }
  if(index*600<=current)return {memory,checkpoint:null};
 }
 const p=address(0);
 // REP MOVSW wraps SI within its source segment, preserving forward-copy order.
 for(let i=0;i<0x430;i+=2){
  const source=p.segment*16+((p.offset+i)&65535);
  if(source+2>memory.length)throw Error('Original checkpoint is outside memory');
  v.setUint16(at(0x8ae6+i),v.getUint16(source,true),true);
 }
 for(let i=0;i<6;i++)memory[at(0x9f5c+i)]=memory[at(0x8ea4+i)];
 v.setUint16(at(0x73b2),v.getUint16(at(0x8c26),true),true);
 return {memory,checkpoint:index};
}
