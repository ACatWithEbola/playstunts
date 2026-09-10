/** Original22f0a/22f15 resource lookup used by bitmap and menu callers. Names are padded in the
 * data segment, and returned pointers are normalized to a paragraph. */
export function findOriginalResource(memory:Uint8Array,d:number,offset:number,segment:number,name:number,required=false){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const byte=(base:number,at:number)=>memory[base+(at&65535)];
 const word=(base:number,at:number)=>view.getUint16(base+(at&65535),true);
 let padding=false;
 for(let i=0;i<4;i++){if(byte(d,name+i)===0)padding=true;if(padding)memory[d+((name+i)&65535)]=32;}
 const base=segment*16,count=word(base,offset+4);let remaining=count,entry=(offset+6)&65535;
 if(count)for(;;){
  let matched=true;
  for(let i=0;i<4;i++){
   const actual=byte(base,entry+i),wanted=byte(d,name+i);
   if(actual!==wanted){matched=actual===0&&wanted===32;break;}
  }
  if(matched){
   const table=(entry+((count*4)&65535))&65535;
   const relative=word(base,table)+word(base,table+2)*65536;
   const address=(base+((count*8+6)&65535)+relative)>>>0;
   return {offset:address&15,segment:(address>>>4)&65535};
  }
  entry=(entry+4)&65535;remaining=(remaining-1)&65535;
  if(remaining&32768)break;
 }
 if(required)throw Error('Required original resource is missing');
 return null;
}
