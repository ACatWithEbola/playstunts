const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original CGA260F6/26114 and TDY25F86/25FA4. Raw bitmaps retain
 * sub-byte x alignment, unlike their compressed counterparts. */
export function drawOriginalPackedDisplayRawBitmap(memory:Uint8Array,mode:'cga'|'tandy',offset:number,segment:number,position?:{x:number;y:number},operation:'copy'|'and'|'or'='copy'){
 const c=0x209e0,block=mode==='cga'?0x6864:0x63d4,source=u(segment)*16,read=(at:number)=>memory[source+u(at)],word=(at:number)=>read(at)|(read(at+1)<<8),cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at+1)]<<8),dest=cw(block)*16;
 let x=s(position?.x??word(offset+8)),y=s(position?.y??word(offset+10)),height=word(offset+2),cursor=u(offset+16);
 const write=(at:number,value:number)=>{memory[dest+at]=operation==='copy'?value:operation==='and'?memory[dest+at]&value:memory[dest+at]|value;};
 const width=word(offset),left=s(cw(block+10)),right=s(cw(block+12)),top=s(cw(block+14)),bottom=s(cw(block+16));
 if(y<top){const end=s(y+height);if(end<=top)return;const count=u(end-top);cursor=u(cursor+((height-count)&255)*(width&255));height=count;y=top;}
 let end=s(y+height);if(end>bottom){const excess=u(end-bottom),stop=s(height)<=s(excess);height=u(height-excess);if(stop)return;}
 const shift=mode==='cga'?2:1,bits=(x&((1<<shift)-1))*(mode==='cga'?2:4);x>>=shift;let visible=width,gap=0,edges=3;
 if(x<left){end=s(x+width);if(end<left)return;let count=u(end-left);cursor=u(cursor+width-count);edges=1;const span=u(right-left);if(s(count)>=s(span)){count=span;edges=0;}visible=count;gap=u(width-count);x=left;}
 else {end=s(x+width);if(end>=right){edges=2;const excess=u(end-right),stop=s(width)<=s(excess);visible=u(width-excess);if(stop)return;gap=excess;}}
 if(!bits&&!visible)return;
 const high=(255<<(8-bits))&255,low=255>>>bits;
 for(let row=0;row<Math.max(1,s(height));row++){
  let target=u(cw(cw(block+8)+(y+row)*2)+x);
  if(!bits){for(let col=0;col<visible;col++){write(target,read(cursor));cursor=u(cursor+1);target=u(target+1);}}
  else {
   let carry=edges&2?(operation==='copy'?memory[dest+target]&high:operation==='and'?high:0):(read(cursor-1)<<(8-bits))&255;
   for(let col=0;col<visible;col++){const value=read(cursor);cursor=u(cursor+1);write(target,(value>>>bits)|carry);carry=(value<<(8-bits))&255;target=u(target+1);}
   if((edges&1)||!visible)write(target,operation==='copy'?(memory[dest+target]&low)|carry:operation==='and'?carry|low:carry);
  }
  cursor=u(cursor+gap);
 }
}
