import {originalScaledSpriteLayout} from './scaled-sprite-layout.ts';
const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original CGA270C2/TDY26C38 anchored, clipped transparent sprite scaling. */
export function drawOriginalPackedScaledSprite(memory:Uint8Array,d:number,mode:'cga'|'tandy',offset:number,segment:number,scale:number,position:{x:number;y:number}){
 const layout=originalScaledSpriteLayout(memory,mode,offset,segment,scale,position);if(!layout)return;
 const c=0x209e0,block=mode==='cga'?0x6864:0x63d4,cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at)+1]<<8),source=u(segment)*16,dest=cw(block)*16,acc=d+(mode==='cga'?0x58ae:0x58ea),shift=mode==='cga'?2:1,pixelMask=(1<<shift)-1,first=layout.x&pixelMask,byteX=layout.x>>>shift;
 let phase=mode==='cga'?((layout.phaseX&1)?8:(layout.storedY&1)*16):((layout.storedY^layout.phaseX)&1)*4,cursor=layout.cursor;
 memory[acc]=layout.fractionY;memory[acc+1]=0;
 for(let row=0;row<Math.max(1,s(layout.height));row++){
  let from=cursor,fraction=layout.fractionX,target=u(cw(cw(block+8)+u(layout.y+row)*2)+byteX);
  for(let col=0;col<Math.max(1,s(layout.width));col++){
   const value=memory[source+from],pixel=(first+col)&pixelMask;
   if(value!==255){
    if(mode==='cga'){const mask=0xc0>>>(pixel*2),table=0x5344+((phase&16)?512:0)+(((pixel&1)^((phase>>>3)&1))*256);memory[dest+target]=(memory[dest+target]&(~mask&255))|(memory[d+table+value]&mask);}
    else {const mask=pixel?15:240,table=0x547c+((phase&4)?512:0)+pixel*256;memory[dest+target]=(memory[dest+target]&(~mask&255))|memory[d+table+value];}
   }
   if(col+1<Math.max(1,s(layout.width))){fraction=u(fraction+layout.step);from=u(from+(fraction>>>8));fraction&=255;if(pixel===pixelMask)target=u(target+1);}
  }
  if(row+1<Math.max(1,s(layout.height))){phase^=mode==='cga'?16:4;const fraction=u((memory[acc]|(memory[acc+1]<<8))+layout.step);cursor=u(cursor+(fraction>>>8)*layout.originalWidth);memory[acc]=fraction&255;memory[acc+1]=0;}
 }
}
