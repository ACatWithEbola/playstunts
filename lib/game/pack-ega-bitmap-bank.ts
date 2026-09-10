/** Original316A2 planar-bank packing. Each present plane gets its own RLE
 * terminator, while the pending literal byte carries across plane boundaries.
 * This byte state affects runs starting at the next plane. */
export function packOriginalEgaBitmapBank(source:Uint8Array,destination:Uint8Array){
 const input=new DataView(source.buffer,source.byteOffset,source.byteLength),output=new DataView(destination.buffer,destination.byteOffset,destination.byteLength),count=input.getUint16(4,true),dataStart=count*8+6;
 if(source.length<65536||destination.length<65536||dataStart>65535)throw Error('EGA packing needs complete retained bank windows');
 destination.set(source.subarray(0,count*4+6));let out=dataStart;
 const read=(at:number)=>{if(at<0||at>=source.length)throw Error('EGA source crosses the supported bank');return source[at];},emit=(value:number)=>{if(out>=destination.length)throw Error('EGA packed bank exceeds destination');destination[out++]=value;};
 for(let index=0;index<(count<<16>>16);index++){
  const start=dataStart+input.getUint32(6+count*4+index*4,true);output.setUint32(6+count*4+index*4,out-dataStart,true);for(let i=0;i<16;i++)emit(read(start+i));
  const pointerBase=start&~15,readPixel=(at:number)=>read(pointerBase+((at-pointerBase)&65535));
  let cursor=start+16,literalStart=cursor,literals=0;
  for(let plane=0;plane<4;plane++){
   if(!(read(start+12+plane)&15))continue;
   let remaining=(input.getUint16(start,true)*input.getUint16(start+2,true))<<16>>16;
   while(remaining>0){
    let run=0;const value=readPixel(cursor);while(readPixel(cursor+run)===value){if(++run===65536)throw Error('Original EGA run scan did not terminate');}run=run<<16>>16;
    if(run>3||literals>=remaining){
     while(literals>127){emit(129);for(let i=0;i<127;i++)emit(readPixel(literalStart++));literals-=127;remaining-=127;}
     if(literals){emit(-literals);remaining-=literals;for(let i=0;i<literals;i++)emit(readPixel(literalStart++));}
     run=Math.min(run,remaining);
     while(run>127){emit(127);emit(readPixel(cursor));cursor+=127;run-=127;remaining-=127;}
     if(run>3){emit(run);emit(readPixel(cursor));cursor+=run;remaining-=run;}
     literalStart=cursor;literals=0;
    }
    cursor++;literals++;
   }
   emit(0);
  }
 }
 return {paragraphs:Math.ceil(out/16),bytesWritten:out};
}
