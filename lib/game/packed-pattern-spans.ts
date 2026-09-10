const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original CGA2788D/TDY27255 transparent pattern spans. Lookup expansion,
 * destination-byte phase and the retained alternating pattern banks are exact. */
export function drawOriginalPackedPatternSpans(memory:Uint8Array,d:number,mode:'cga'|'tandy',leftOffset:number,rightOffset:number,y:number,count:number,colour:number,twoColour=false){
 const c=0x209e0,block=mode==='cga'?0x6864:0x63d4,base=mode==='cga'?(twoColour?0x51fa:0x575e):(twoColour?0x531e:0x58a8),bank=mode==='cga'?(twoColour?0x5206:0x576a):(twoColour?0x5324:0x58ae),bankSize=mode==='cga'?2:4,shift=mode==='cga'?2:1,units=1<<shift,cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at+1)]<<8),dw=(at:number)=>memory[d+u(at)]|(memory[d+u(at+1)]<<8),put=(at:number,value:number)=>{memory[d+u(at)]=value&255;memory[d+u(at+1)]=(value>>>8)&255;},dest=cw(block)*16,swapWord=(value:number)=>((value&255)<<8)|(value>>>8),lookup=(value:number)=>dw(0x39c8+(value&255)*2),pattern=dw(0x4b20);
 for(let row=0;row<2;row++){const expanded=lookup(row?pattern&255:pattern>>>8);if(mode==='cga')put(bank+row*2,swapWord(expanded));else {put(bank+row*4,swapWord(lookup(expanded>>>8)));put(bank+row*4+2,swapWord(lookup(expanded&255)));}}
 const swap=()=>{for(let i=0;i<bankSize;i++){const byte=memory[d+bank+i];memory[d+bank+i]=memory[d+bank+bankSize+i];memory[d+bank+bankSize+i]=byte;}};
 if(!(y&1))swap();
 for(let row=0;row<Math.max(1,s(count));row++){
  const left=dw(leftOffset+row*2),difference=u(dw(rightOffset+row*2)-left),width=u(difference+1);
  if(s(difference)>=0){const colourByte=!twoColour&&mode==='cga'&&!(u(y+row)&1)?(colour>>>8)&255:colour&255,index=left&(units-1);let target=u(cw(cw(block+8)+(y+row)*2)+(left>>>shift));
   const write=(mask:number)=>{const pattern=mask&memory[d+bank+(target&(bankSize-1))],at=(dest+target)&0xfffff;if(twoColour)memory[at]=(memory[at]&(~mask&255))|(memory[d+0x4b22]&pattern)|(colourByte&(~pattern&255));else memory[at]=(memory[at]&(~pattern&255))|(colourByte&pattern);};
   const first=memory[d+base+index],step=memory[d+base+units*2+index],remaining=u(width-step);
   if(s(width)<step)write(first&memory[d+base+units+u(remaining+units-1)]);
   else if(!remaining)write(first);
   else {write(first);target=u(target+1);for(let n=0;n<(remaining>>>shift);n++){write(255);target=u(target+1);}const tail=remaining&(units-1);if(tail)write(memory[d+base+units-1+tail]);}
  }
  swap();
 }
}
