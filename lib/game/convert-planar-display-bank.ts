const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original CGA28FE1 maps packed EGA colour pairs through sixteen CGA patterns. */
export function loadOriginalCgaPlanarColourTable(memory:Uint8Array,d:number,offset:number,segment:number){
 const base=u(segment)*16;for(let value=0;value<256;value++)memory[d+0x57ae+value]=(memory[(base+u(offset+(value>>>4)))&0xfffff]&204)|(memory[(base+u(offset+(value&15)))&0xfffff]&51);
}
/** Original CGA28E0A/TDY288DA planar-bank conversion. CGA first expands
 * four-bit pairs in the destination, then compacts them in place, retaining
 * the intermediate bytes beyond its final bank size. */
export function convertOriginalPlanarDisplayBank(memory:Uint8Array,d:number,mode:'cga'|'tandy',sourceSegment:number,destinationSegment:number){
 const source=u(sourceSegment)*16,destination=u(destinationSegment)*16,shift=mode==='cga'?1:2,byte=(base:number,at:number)=>memory[(base+u(at))&0xfffff],word=(base:number,at:number)=>byte(base,at)|(byte(base,at+1)<<8),put=(base:number,at:number,value:number)=>{memory[(base+u(at))&0xfffff]=value&255;memory[(base+u(at)+1)&0xfffff]=(value>>>8)&255;};
 const count=word(source,4),dataStart=u(count*8+6);let input=4,output=4;
 for(let n=0;n<u(count*2+1);n++){put(destination,output,word(source,input));input=u(input+2);output=u(output+2);}
 let table=output;put(destination,table,0);put(destination,table+2,0);
 const entry=(base:number,index:number)=>{const at=u(word(base,4)*4+index*4+6),address=(base+u(word(base,4)*8+6)+word(base,at)+word(base,at+2)*65536)&0xfffff;return {base:address&0xffff0,offset:address&15};};
 for(let index=0;index<s(count);index++){
  const from=entry(source,index),width=word(from.base,from.offset),height=word(from.base,from.offset+2),product=width*height,length=u(product),next=word(destination,table)+u((length<<shift)+16)+(word(destination,table+2)+(product>>>16))*65536;table=u(table+4);
  if(index+1<s(count)){put(destination,table,next);put(destination,table+2,next>>>16);}else{const size=(next+dataStart)>>>0;put(destination,0,size);put(destination,2,size>>>16);}
  const to=entry(destination,index);for(let n=0;n<6;n++)put(to.base,to.offset+n*2,word(from.base,from.offset+n*2));const columns=u(width<<shift);put(to.base,to.offset,columns);
  const pixels=u(to.offset+16);
  if(s(length)>0&&length<=8000){
   const background=byte(from.base,from.offset+13)>>>4,value=background*17;let target=pixels;
   for(let n=0;n<length*2;n++){put(to.base,target,value*257);target=u(target+2);}
   let cursor=u(from.offset+16);
   for(let slot=0;slot<4;slot++){
    const mask=byte(from.base,from.offset+12+slot)&15;if(!mask)break;target=pixels;
    for(let n=0;n<length;n++){const bits=byte(from.base,cursor++);for(let pair=0;pair<4;pair++){const at=(to.base+target)&0xfffff;memory[at]|=(bits&(128>>>(pair*2))?mask<<4:0)|(bits&(64>>>(pair*2))?mask:0);target=u(target+1);}}
   }
  }
  if(mode==='cga'){
   let cursor=pixels,target=pixels;const startY=word(to.base,to.offset+10);
   for(let row=0;row<Math.max(1,s(height));row++)for(let x=0;x<(columns||65536);x++){
    const a=memory[d+0x57ae+byte(to.base,cursor++)],b=memory[d+0x57ae+byte(to.base,cursor++)],value=(startY+row)&1?((a<<4)&255)|(b&15):(a&240)|(b>>>4);memory[(to.base+target)&0xfffff]=value;target=u(target+1);
   }
  }
 }
 return {bytesWritten:(word(destination,0)+word(destination,2)*65536)>>>0};
}
