import {restoreOriginalDisplayWindow} from './select-display-window.ts';
import type {OriginalEgaBitmapOperation} from './ega-display-bitmap.ts';
const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original2CAB6 creates EGA screen-page descriptors, aligns each page start
 * to 256 bytes, sets the CRTC stride and restores the retained display index. */
export function* defineOriginalEgaScreenWindows(memory:Uint8Array,d:number,width:number,height:number,pageCount:number):Generator<OriginalEgaBitmapOperation,{error:null|'page-count'|'window-table'},number>{
 const c=0x209e0,word=(base:number,at:number)=>memory[base+u(at)]|(memory[base+u(at+1)]<<8),put=(base:number,at:number,value:number)=>{memory[base+u(at)]=value&255;memory[base+u(at+1)]=(value>>>8)&255;};
 if(s(pageCount)>8)return {error:'page-count'};
 width=u(width);height=u(height);let offset=0x9a42,start=0;
 for(let page=0;page<Math.max(1,s(pageCount));page++){
  put(c,0xc0b6+page*4,offset);put(c,0xc0b8+page*4,0x209e);
  const next=u(offset+u((height+15)*2));if(next>=0xa852){memory[d+0x571e]=(page+48)&255;return {error:'window-table'};}
  if(next>=word(c,0x9a40))put(c,0x9a40,next);
  const rounded=width&7?u(width+8)&0xfff8:width,stride=rounded>>>3;
  put(c,offset,start);for(let plane=0;plane<4;plane++)put(c,offset+2+plane*2,0xa000);
  for(const [field,value] of [[10,offset+30],[12,0],[26,0],[24,rounded],[28,rounded],[14,stride],[20,stride],[16,0],[18,height],[22,0]])put(c,offset+field,value);
  put(d,0x563c,stride);
  for(let row=0;row<(height||65536);row++)put(c,offset+30+row*2,start+row*stride);
  start=u(start+(height||65536)*stride);if(start&255)start=u((start&0xff00)+256);offset=next;
 }
 yield {kind:'port-word',port:word(0x400,0x63),value:(((width>>>4)&255)<<8)|0x13};
 restoreOriginalDisplayWindow(memory,d,'ega');return {error:null};
}
