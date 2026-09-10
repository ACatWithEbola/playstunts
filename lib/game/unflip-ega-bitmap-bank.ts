const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original2C9D0 transposes the flagged planes of an allocated PES bank.
 * Header flags and unselected planes remain unchanged. */
export function unflipOriginalEgaBitmapBank(memory:Uint8Array,sourceSegment:number,scratchSegment:number,scratchOffset=0){
 const source=u(sourceSegment)*16,scratch=u(scratchSegment)*16,byte=(base:number,at:number)=>memory[(base+u(at))&0xfffff],word=(base:number,at:number)=>byte(base,at)|(byte(base,at+1)<<8),count=word(source,4);
 for(let index=0;index<Math.max(1,s(count));index++){
  const table=u(count*4+index*4+6),address=(source+u(count*8+6)+word(source,table)+word(source,table+2)*65536)&0xfffff,base=address&0xffff0,offset=address&15;
  if(byte(base,offset+15)&240)continue;let flags=byte(base,offset+14)>>>4;if(!flags)continue;
  const width=word(base,offset),height=word(base,offset+2),length=u(width*height);if(!width||!height)throw Error('Original zero-dimension PES transpose requires its full wrapped traversal');
  let cursor=u(offset+16);
  for(let plane=0;plane<4;plane++,flags>>>=1){
   if(flags&1){let out=u(scratchOffset);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){memory[(scratch+out)&0xfffff]=byte(base,cursor+y+x*height);out=u(out+1);}
    for(let n=0;n<length;n++)memory[(base+u(cursor+n))&0xfffff]=byte(scratch,scratchOffset+n);
   }
   cursor=u(cursor+length);
  }
 }
}
