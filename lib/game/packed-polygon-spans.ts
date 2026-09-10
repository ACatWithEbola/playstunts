const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original CGA26F42/TDY26ACC polygon span writes. CGA alternates the
 * two colour bytes by row; Tandy uses DL throughout. */
export function drawOriginalPackedPolygonSpans(memory:Uint8Array,d:number,mode:'cga'|'tandy',leftOffset:number,rightOffset:number,y:number,count:number,colour:number){
 const c=0x209e0,block=mode==='cga'?0x6864:0x63d4,base=mode==='cga'?0x574e:0x589e,shift=mode==='cga'?2:1,units=1<<shift,cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at+1)]<<8),dw=(at:number)=>memory[d+u(at)]|(memory[d+u(at+1)]<<8),dest=cw(block)*16;
 for(let row=0;row<Math.max(1,s(count));row++){
  const left=dw(leftOffset+row*2),difference=u(dw(rightOffset+row*2)-left),width=u(difference+1);if(s(difference)<0)continue;
  const colourByte=mode==='cga'&&!(u(y+row)&1)?(colour>>>8)&255:colour&255,index=left&(units-1);let target=u(cw(cw(block+8)+(y+row)*2)+(left>>>shift));
  const write=(mask:number)=>{const at=(dest+target)&0xfffff;memory[at]=(memory[at]&(~mask&255))|(colourByte&mask);};
  const first=memory[d+base+index],remaining=u(width-memory[d+base+units*2+index]);
  if(s(width)<s(memory[d+base+units*2+index]))write(first&memory[d+base+units+u(remaining+3)]);
  else if(!remaining)write(first);
  else {write(first);target=u(target+1);for(let n=0;n<(remaining>>>shift);n++){write(255);target=u(target+1);}const tail=remaining&(units-1);if(tail)write(memory[d+base+units-1+tail]);}
 }
}
