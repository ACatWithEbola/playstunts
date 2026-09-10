const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original CGA274B0/275DF and TDY27020/27141 indexed transparent sprites.
 * A supplied position selects the clipped entry; stored positions are unclipped. */
export function drawOriginalPackedIndexedSprite(memory:Uint8Array,d:number,mode:'cga'|'tandy',offset:number,segment:number,position?:{x:number;y:number}){
 const c=0x209e0,block=mode==='cga'?0x6864:0x63d4,source=u(segment)*16,read=(at:number)=>memory[source+u(at)],word=(at:number)=>read(at)|(read(at+1)<<8),cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at)+1]<<8);
 let x=u(position?.x??word(offset+8)),y=u(position?.y??word(offset+10)),width=word(offset),height=word(offset+2),cursor=u(offset+16),gap=0;
 let phase=mode==='cga'?(word(offset+10)&1)*16:(word(offset+10)&1)*4;
 if(mode==='cga'&&(x&1))phase=position?8:phase|8;
 if(mode==='tandy'&&!position)phase=((word(offset+10)^x)&1)*4;
 if(position){
  const originalWidth=width,left=cw(block+24),right=cw(block+26),top=cw(block+14),bottom=cw(block+16);
  if(s(x)<s(left)){const visible=u(x+width-left);if(s(visible)<=0)return;gap=u(width-visible);cursor=u(cursor+gap);width=visible;x=left;}
  let excess=u(x+width-right);if(s(excess)>0){width=u(width-excess);if(s(width)<=0)return;gap=u(gap+excess);}
  if(s(y)<s(top)){const visible=u(y+height-top);if(s(visible)<=0)return;cursor=u(cursor+u(height-visible)*originalWidth);height=visible;y=top;}
  excess=u(y+height-bottom);if(s(excess)>=0){height=u(height-excess);if(s(height)<=0)return;}
 }
 const shift=mode==='cga'?2:1,pixelMask=(1<<shift)-1,first=x&pixelMask,byteX=x>>>shift,dest=cw(block)*16;
 let rowPointer=u(cw(block+8)+y*2);
 for(let row=0;row<Math.max(1,s(height));row++){
  let target=u(cw(rowPointer)+byteX);
  for(let col=0;col<Math.max(1,s(width));col++){
   const value=read(cursor);cursor=u(cursor+1);const pixel=(first+col)&pixelMask;
   if(value!==255){
    if(mode==='cga'){const mask=0xc0>>>(pixel*2),table=0x5344+((phase&16)?512:0)+(((pixel&1)^((phase>>>3)&1))*256);memory[dest+target]=(memory[dest+target]&(~mask&255))|(memory[d+table+value]&mask);}
    else {const mask=pixel?15:240,table=0x547c+((phase&4)?512:0)+pixel*256;memory[dest+target]=(memory[dest+target]&(~mask&255))|memory[d+table+value];}
   }
   if(pixel===pixelMask)target=u(target+1);
  }
  rowPointer=u(rowPointer+2);cursor=u(cursor+gap);phase^=mode==='cga'?16:4;
 }
}
