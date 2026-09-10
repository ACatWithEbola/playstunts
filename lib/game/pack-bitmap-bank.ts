/** Original2c7d2..2caef, with each individual bitmap contained in a 64KiB window.
 * Caller supplies retained source/destination bytes. The size header is copied
 * unchanged; the original allocator receives the returned paragraph count. */
export function packOriginalBitmapBank(source:Uint8Array,destination:Uint8Array){
 if(source.length<65536||destination.length<65536)throw Error('Bitmap packing needs the retained bank windows');
 const input=new DataView(source.buffer,source.byteOffset,source.byteLength),output=new DataView(destination.buffer,destination.byteOffset,destination.byteLength);
 const count=input.getUint16(4,true),dataStart=count*8+6;
 if(dataStart>65535)throw Error('Bitmap bank header exceeds the supported window');
 destination.set(source.subarray(0,count*4+6));let out=dataStart;
 const read=(at:number)=>{if(at<0||at>=source.length)throw Error('Bitmap source crosses the supported window');return source[at];};
 const emit=(value:number)=>{if(out>=destination.length)throw Error('Packed bitmap bank crosses the supported window');destination[out++]=value;};
 for(let index=0;index<count;index++){
  const start=dataStart+input.getUint32(6+count*4+index*4,true);
  if(start+16>source.length)throw Error('Bitmap header crosses the supported window');
  output.setUint32(6+count*4+index*4,out-dataStart,true);
  for(let i=0;i<16;i++)emit(read(start+i));
  let remaining=(input.getUint16(start,true)*input.getUint16(start+2,true))&65535;
  let cursor=start+16,literalStart=cursor,literals=0;
  while(remaining){
   let run=0;const value=read(cursor);
   while(read(cursor+run)===value)run++;
   if(run>3||literals>=remaining){
    while(literals>127){emit(129);for(let i=0;i<127;i++)emit(read(literalStart++));literals-=127;remaining-=127;}
    if(literals){emit(-literals);remaining-=literals;for(let i=0;i<literals;i++)emit(read(literalStart++));}
    run=Math.min(run,remaining);
    while(run>127){emit(127);emit(read(cursor));cursor+=127;run-=127;remaining-=127;}
    if(run>3){emit(run);emit(read(cursor));cursor+=run;remaining-=run;}
    literalStart=cursor;literals=0;
   }
   cursor++;literals++;
  }
  emit(0);
 }
 return {paragraphs:Math.ceil(out/16),bytesWritten:out};
}
