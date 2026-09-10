import {originalScaledSpriteLayout} from './scaled-sprite-layout.ts';
import type {OriginalEgaBitmapOperation} from './ega-display-bitmap.ts';
const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original EGA29978 scaled indexed sprite drawing into the video aperture. */
export function* drawOriginalEgaScaledSprite(memory:Uint8Array,d:number,offset:number,segment:number,scale:number,position:{x:number;y:number}):Generator<OriginalEgaBitmapOperation,void,number>{
 const layout=originalScaledSpriteLayout(memory,'ega',offset,segment,scale,position);if(!layout)return;
 const c=0x209e0,cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at)+1]<<8),source=u(segment)*16,first=layout.x&7,byteX=layout.x>>>3,put=(at:number,value:number)=>{memory[d+at]=value&255;memory[d+at+1]=(value>>>8)&255;},word=(at:number)=>memory[d+at]|(memory[d+at+1]<<8);
 if(cw(0x9114)!==0xa000)throw Error('EGA scaled sprite requires the selected video aperture');
 let phase=(layout.storedY^layout.phaseX)&1,cursor=layout.cursor;put(0x56fa,layout.fractionY);
 for(let row=0;row<Math.max(1,s(layout.height));row++){
  let from=cursor,target=u(cw(cw(0x911c)+u(layout.y+row)*2)+byteX);put(0x56fc,layout.fractionX);
  yield {kind:'port-word',port:0x3ce,value:0x205};
  for(let col=0;col<Math.max(1,s(layout.width));col++){
   const value=memory[source+from],pixel=(first+col)&7;
   if(value!==255){yield {kind:'port-word',port:0x3ce,value:((128>>>pixel)<<8)|8};yield {kind:'read',offset:target};yield {kind:'write',offset:target,value:memory[d+(((pixel&1)^phase)?0x5502:0x53f2)+value]};}
   if(col+1<Math.max(1,s(layout.width))){const fraction=u(word(0x56fc)+layout.step);from=u(from+(fraction>>>8));put(0x56fc,fraction&255);if(pixel===7)target=u(target+1);}
  }
  if(row+1<Math.max(1,s(layout.height))){phase^=1;const fraction=u(word(0x56fa)+layout.step);cursor=u(cursor+(fraction>>>8)*layout.originalWidth);put(0x56fa,fraction&255);}
 }
 yield {kind:'port-word',port:0x3ce,value:0xff08};yield {kind:'port-word',port:0x3ce,value:5};
}
