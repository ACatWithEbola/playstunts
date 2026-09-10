import type {OriginalEgaBitmapOperation} from './ega-display-bitmap.ts';
const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original EGA29BB2 clipped /29CD9 stored indexed sprite paths. */
export function* drawOriginalEgaIndexedSprite(memory:Uint8Array,d:number,offset:number,segment:number,position?:{x:number;y:number}):Generator<OriginalEgaBitmapOperation,void,number>{
 const c=0x209e0,source=u(segment)*16,read=(at:number)=>memory[source+u(at)],word=(at:number)=>read(at)|(read(at+1)<<8),cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at)+1]<<8);
 let x=u(position?.x??word(offset+8)),y=u(position?.y??word(offset+10)),width=word(offset),height=word(offset+2),cursor=u(offset+16),gap=0;
 let phase=(word(offset+10)^x)&1;
 if(position){
  const originalWidth=width,left=cw(0x912c),right=cw(0x912e),top=cw(0x9122),bottom=cw(0x9124);
  if(s(x)<s(left)){const visible=u(x+width-left);if(s(visible)<=0)return;gap=u(width-visible);cursor=u(cursor+gap);width=visible;x=left;}
  let excess=u(x+width-right);if(s(excess)>0){width=u(width-excess);if(s(width)<=0)return;gap=u(gap+excess);}
  if(s(y)<s(top)){const visible=u(y+height-top);if(s(visible)<=0)return;cursor=u(cursor+u(height-visible)*originalWidth);height=visible;y=top;}
  excess=u(y+height-bottom);if(s(excess)>=0){height=u(height-excess);if(s(height)<=0)return;}
 }
 const hardware=cw(0x9114)===0xa000,first=x&7,byteX=x>>>3;let rowPointer=u(cw(0x911c)+y*2);
 if(hardware){yield {kind:'port-word',port:0x3c4,value:0xf02};yield {kind:'port-word',port:0x3ce,value:0x205};}
 for(let row=0;row<Math.max(1,s(height));row++){
  let target=u(cw(rowPointer)+byteX);
  for(let col=0;col<Math.max(1,s(width));col++){
   const value=read(cursor);cursor=u(cursor+1);const pixel=(first+col)&7;
   if(value!==255){
    const table=hardware?((pixel&1)^phase):((col&1)^phase),colour=memory[d+(table?0x5502:0x53f2)+value];
    if(hardware){yield {kind:'port-word',port:0x3ce,value:((128>>>pixel)<<8)|8};yield {kind:'read',offset:target};yield {kind:'write',offset:target,value:colour};}
    else {
     const pointX=u(x+col),pointTarget=u(cw(cw(0x911c)+u(y+row)*2)+(pointX>>>3)),mask=memory[d+0x56c2+(pointX&7)];
     for(let plane=0;plane<4;plane++){const destination=cw(0x9114+plane*2);if(destination){const at=(destination*16+pointTarget)&0xfffff;memory[at]=colour&(1<<plane)?memory[at]|mask:memory[at]&(~mask&255);}}
    }
   }
   if(pixel===7)target=u(target+1);
  }
  rowPointer=u(rowPointer+2);cursor=u(cursor+gap);if(hardware)phase^=1;
 }
 if(hardware){yield {kind:'port-word',port:0x3ce,value:0xff08};yield {kind:'port-word',port:0x3ce,value:5};}
}
