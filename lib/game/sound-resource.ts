/** Locate a four-byte resource identifier within an original unpacked bank. */
export function soundResourceOffset(bank:Uint8Array,name:Uint8Array,start=0):number|null{
 const v=new DataView(bank.buffer,bank.byteOffset,bank.byteLength);
 if(name.length!==4||start<0||start+6>bank.length)throw Error('Invalid sound resource lookup');
 const size=v.getUint32(start,true),count=v.getUint16(start+4,true),base=start+6+count*8;
 if(start+size>bank.length||base>start+size)throw Error('Truncated sound bank');
 const fold=(byte:number)=>byte>=97&&byte<=122?byte-32:byte;
 for(let i=0;i<count;i++)if(name.every((byte,j)=>fold(bank[start+6+i*4+j])===fold(byte))){
  const offset=base+v.getUint32(start+6+count*4+i*4,true);
  if(offset>start+size)throw Error('Invalid sound resource offset');
  return offset;
 }
 return null;
}
