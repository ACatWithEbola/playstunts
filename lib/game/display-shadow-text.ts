import {drawOriginalPackedDisplayFont} from './packed-display-font.ts';
import {drawOriginalEgaDisplayFont} from './ega-display-font.ts';
import type {OriginalEgaBitmapOperation} from './ega-display-bitmap.ts';
/** Original1B2D2 label bounds and two transparent passes in each display mode. */
export function* drawOriginalDisplayShadowText(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',text:number,x:number,y:number,colour:number,shadow:number):Generator<OriginalEgaBitmapOperation,number,number>{
 const u=(n:number)=>n&65535,word=(base:number,at:number)=>memory[base+u(at)]|(memory[base+u(at+1)]<<8),put=(base:number,at:number,value:number)=>{memory[base+u(at)]=value&255;memory[base+u(at+1)]=(value>>>8)&255;},font=word(d,0x4dd2)*16,bounds=mode==='cga'?0x6edc:mode==='tandy'?0x6f18:0x6d64,height=mode==='cga'?0xa5e4:mode==='tandy'?0xa624:0xa460;
 let width=0;for(let i=0;i<65536;i++){const code=memory[d+u(text+i)];if(!code)break;const glyph=word(font,22+code*2);if(glyph)width=u(width+(memory[font+20]?memory[font+glyph]:word(font,16)));}
 put(d,bounds,x);put(d,bounds+2,x+width+1);put(d,bounds+4,y);put(d,bounds+6,y+word(d,height)+1);
 for(const [value,px,py] of [[shadow,u(x+1),u(y+1)],[colour,x,y]]){
  put(font,0,value&(mode==='cga'?3:15));put(font,2,0);
  if(mode==='ega')yield* drawOriginalEgaDisplayFont(memory,d,text,px,py,false);else drawOriginalPackedDisplayFont(memory,d,mode,text,px,py,false);
 }
 return bounds;
}
