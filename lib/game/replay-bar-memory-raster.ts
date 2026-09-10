import {presentOriginalReplayBar} from './replay-bar-presentation.ts';
import {drawOriginalUnclippedPackedBitmap} from './cockpit-bitmap-raster.ts';
import {drawOriginalFontMemory} from './draw-font-memory.ts';
import {fillOriginalBitmapRectangle,outlineOriginalBitmapRectangle} from './fill-bitmap-rectangle.ts';
/** Replay mode1 with actual loaded packed sprites and mutable font banks.
 * Software mouse visibility remains owned by the outer display host. */
export function drawOriginalReplayBarMemory(m:Uint8Array,d:number,start:number,current:number,cs=0x209e0){
 const v=new DataView(m.buffer,m.byteOffset,m.byteLength),u=(n:number)=>n&65535,word=(base:number,at:number)=>v.getUint16(base+u(at),true),set=(base:number,at:number,n:number)=>v.setUint16(base+u(at),u(n),true);
 const back=()=>{m[d+0x131]=0;},font=(at:number)=>{const seg=word(d,at+2);set(d,0x4dd2,seg);set(d,0xa004,word(seg*16,word(d,at)+14));};
 presentOriginalReplayBar(m,d,start,current,{
  sprite(off,seg){back();drawOriginalUnclippedPackedBitmap(m,off,seg,word(seg*16,off+8),word(seg*16,off+10),'copy',cs);},
  time(text,x,y){
   for(let i=0;i<=text.length;i++)m[d+0xa9f4+i]=i===text.length?0:text.charCodeAt(i);
   const oldFont=word(d,0x4dd2)*16;set(oldFont,0,word(d,0x4e8a)&255);set(oldFont,2,0);back();font(0xa006);
   drawOriginalFontMemory(m,d,0xa9f4,x,y,cs);font(0x9ada);
  },
  fill(x,y,width,height,color){back();fillOriginalBitmapRectangle(m,x,y,width,height,color,false,cs);},
  outline(left,top,right,bottom,color){back();outlineOriginalBitmapRectangle(m,left,top,right,bottom,color,cs);},
 });
 m[d+0x131]=1;
}
