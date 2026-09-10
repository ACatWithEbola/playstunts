/** Original24918..24a71. Convert the three stored bitmap row layouts in
 * place, preserving headers and scratch bytes outside the original writes. */
export function unflipOriginalBitmapBank(bank:Uint8Array,scratch:Uint8Array){
 if(scratch.length<65536)throw Error('Bitmap conversion needs its retained scratch window');
 const view=new DataView(bank.buffer,bank.byteOffset,bank.byteLength),count=view.getUint16(4,true),dataStart=count*8+6;
 for(let index=0;index<count;index++){
  const start=dataStart+view.getUint32(6+count*4+index*4,true);
  if(start+16>bank.length)throw Error('Original bitmap header is outside the bank');
  const type=bank[start+14]>>>4;if((bank[start+15]&240)||!type)continue;
  if(type>=4)return 1;
  const width=view.getUint16(start,true),height=view.getUint16(start+2,true),length=width*height;
  if(!width||!height||length>65535)throw Error('Bitmap conversion dimensions exceed the supported window');
  const read=(at:number)=>{if(at>=bank.length)throw Error('Bitmap conversion needs retained source bytes');return bank[at];};
  const source=start+16;
  if(type===1){
   for(let y=0;y<height;y++)for(let x=0;x<width;x++)scratch[y*width+x]=read(source+y+x*height);
  }else if(type===2){
   // Each parity loop executes at least once, even for a one-row image.
   for(let y=0;y<height;y+=2)for(let x=0;x<width;x++)scratch[y*width+x]=read(source+(y>>>1)+x*height);
   for(let y=1;y<height||y===1;y+=2)for(let x=0;x<width;x++)scratch[y*width+x]=read(source+((y+height)>>>1)+x*height);
  }else{
   for(let y=0;y<height;y+=2){
    let at=source+(y>>>1);
    for(let x=0;x<width;x++,at+=Math.ceil(height/2))scratch[y*width+x]=read(at);
    if(y+1<height)for(let x=0;x<width;x++,at+=height>>>1)scratch[(y+1)*width+x]=read(at);
   }
  }
  bank.set(scratch.subarray(0,length),source);
 }
 return 0;
}
