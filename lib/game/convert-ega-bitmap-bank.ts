const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original2BEE8 converts an allocated, offset-zero indexed bitmap bank to
 * EGA planes using the loaded alternating colour tables. Partial-byte rows
 * deliberately retain the original destination-pointer behavior. */
export function convertOriginalEgaBitmapBank(memory:Uint8Array,d:number,sourceSegment:number,destinationSegment:number){
 const source=u(sourceSegment)*16,destination=u(destinationSegment)*16,byte=(base:number,at:number)=>memory[(base+u(at))&0xfffff],word=(base:number,at:number)=>byte(base,at)|(byte(base,at+1)<<8),put=(base:number,at:number,value:number)=>{memory[(base+u(at))&0xfffff]=value&255;memory[(base+u(at)+1)&0xfffff]=(value>>>8)&255;},long=(base:number,at:number)=>word(base,at)+word(base,u(at+2))*65536;
 const count=word(source,4);let input=4,output=4;
 for(let n=0;n<u(count*2+1);n++){put(destination,output,word(source,input));input=u(input+2);output=u(output+2);}
 let table=output;put(destination,table,0);put(destination,table+2,0);let finalAddress=destination;
 const entry=(base:number,index:number)=>{
  const entries=word(base,4),at=u(u(index*4)+u(entries*4)+6),address=(base+u(u(entries*8)+6)+long(base,at))&0xfffff;
  return {base:address&0xffff0,offset:address&15};
 };
 for(let index=0;index<Math.max(1,s(count));index++){
  const from=entry(source,index),to=entry(destination,index);
  for(let n=0;n<6;n++)put(to.base,to.offset+n*2,word(from.base,from.offset+n*2));
  const width=word(from.base,from.offset),height=word(from.base,from.offset+2),packedWidth=(width>>>3)+(width&7?1:0);put(to.base,to.offset,packedWidth);
  for(let plane=0;plane<4;plane++)memory[to.base+to.offset+12+plane]=1<<plane;
  let out=u(to.offset+16);const length=u(packedWidth*height);
  if(s(length)>0)for(let plane=0;plane<4;plane++){
   let at=out;for(let n=0;n<length;n++)memory[(to.base+u(at+n))&0xfffff]=0;
   let cursor=u(from.offset+16);const firstY=word(from.base,from.offset+10);
   for(let row=0;row<Math.max(1,s(height));row++){
    let mask=128;for(let x=0;x<Math.max(1,s(width));x++){
     const pixel=byte(from.base,cursor++),low=!!((firstY+row+x)&1),colour=memory[d+(low?0x5502:0x53f2)+pixel];
     if(colour&(1<<plane))memory[(to.base+at)&0xfffff]|=mask;
     mask>>>=1;if(!mask){at=u(at+1);mask=128;}
    }
   }
   out=at;
  }
  finalAddress=to.base+out;const previous=long(destination,table);table=u(table+4);
  if(index+1< s(count)){const relative=(previous+u(out-to.offset))>>>0;put(destination,table,relative);put(destination,table+2,relative>>>16);}
 }
 const bytesWritten=(finalAddress-destination)>>>0;put(destination,0,bytesWritten);put(destination,2,bytesWritten>>>16);return {bytesWritten};
}
