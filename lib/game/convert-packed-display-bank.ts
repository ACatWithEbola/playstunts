const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original CGA2916C/TDY28A48 indexed-bank conversion. Byte widths round
 * down, source pixels remain continuous across rows, and untouched header
 * bytes retain destination memory. Colour-table phase follows stored Y. */
export function convertOriginalPackedDisplayBank(memory:Uint8Array,d:number,mode:'cga'|'tandy',sourceSegment:number,destinationSegment:number){
 const source=u(sourceSegment)*16,destination=u(destinationSegment)*16,shift=mode==='cga'?2:1,units=1<<shift,byte=(base:number,at:number)=>memory[(base+u(at))&0xfffff],word=(base:number,at:number)=>byte(base,at)|(byte(base,at+1)<<8),put=(base:number,at:number,value:number)=>{memory[(base+u(at))&0xfffff]=value&255;memory[(base+u(at)+1)&0xfffff]=(value>>>8)&255;};
 const count=word(source,4),dataStart=u(count*8+6);let input=4,output=4;
 for(let n=0;n<u(count*2+1);n++){put(destination,output,word(source,input));input=u(input+2);output=u(output+2);}
 let table=output;put(destination,table,0);put(destination,table+2,0);
 const entry=(base:number,index:number)=>{const at=u(word(base,4)*4+index*4+6),address=(base+u(word(base,4)*8+6)+word(base,at)+word(base,at+2)*65536)&0xfffff;return {base:address&0xffff0,offset:address&15};};
 for(let index=0;index<s(count);index++){
  const from=entry(source,index),width=word(from.base,from.offset),height=word(from.base,from.offset+2),product=width*height,next=(word(destination,table)+((product&65535)>>>shift)+16)+(word(destination,table+2)+(product>>>16))*65536;table=u(table+4);
  if(index+1<s(count)){put(destination,table,next);put(destination,table+2,next>>>16);}else{const size=(next+dataStart)>>>0;put(destination,0,size);put(destination,2,size>>>16);}
  const to=entry(destination,index);for(let n=0;n<6;n++)put(to.base,to.offset+n*2,word(from.base,from.offset+n*2));const columns=width>>>shift;put(to.base,to.offset,columns);
  let cursor=u(from.offset+16),target=u(to.offset+16);const startY=word(from.base,from.offset+10);
  for(let row=0;row<Math.max(1,s(height));row++)for(let x=0;x<(columns||65536);x++){
   let value=0;const odd=(startY+row)&1;
   for(let pixel=0;pixel<units;pixel++){
    const code=byte(from.base,cursor++),table=mode==='cga'?0x5344+odd*512+(pixel&1)*256:0x547c+odd*512+pixel*256,colour=memory[d+table+code];
    value|=mode==='cga'?colour&([192,48,12,3][pixel]):colour;
   }
   memory[(to.base+target)&0xfffff]=value;target=u(target+1);
  }
 }
 return {bytesWritten:(word(destination,0)+word(destination,2)*65536)>>>0};
}
