const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original CGA25CFA / TDY25C40 patterned reveal. The phase advances per
 * visited row, not per row-pattern slot. The caller owns the direction flag. */
export function drawOriginalPackedDisplayReveal(memory:Uint8Array,mode:'cga'|'tandy',offset:number,segment:number,phase:number,reverse=false){
 const c=0x209e0,block=mode==='cga'?0x6864:0x63d4,table=mode==='cga'?0x530a:0x522e,source=u(segment)*16;
 const read=(at:number)=>memory[source+u(at)],word=(at:number)=>read(at)|(read(at+1)<<8),cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at)+1]<<8);
 const dest=cw(block)*16,x=s(word(offset+8))>>(mode==='cga'?2:1),start=u(cw(block+8)+word(offset+10)*2),end=u(start+word(offset+2)*2),width=word(offset),skip=(width&255)*11,step=reverse?-1:1;
 for(let slot=11;slot>=0;slot--){
  const row=memory[c+table+slot];let rowPointer=u(start+row*2),cursor=u(offset+16+(width&255)*row);
  for(let guard=0;rowPointer<end;guard++){
   if(guard===8192)throw Error('Original packed reveal row traversal does not terminate');
   let target=u(cw(rowPointer)+x),mask=memory[c+table+12+(phase&3)];phase&=3;
   for(let col=0;col<(width||65536);col++){
    const value=(read(cursor)&mask)|(memory[dest+target]&(~mask&255));cursor=u(cursor+step);memory[dest+target]=value;target=u(target+step);mask=(mask>>>1)|((mask&1)<<7);
   }
   phase=u(phase+1);rowPointer=u(rowPointer+24);cursor=u(cursor+skip);
  }
 }
}
