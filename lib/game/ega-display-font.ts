import {drawOriginalEgaHardwareFontGlyph} from './ega-hardware-font-glyph.ts';
import type {OriginalEgaBitmapOperation} from './ega-display-bitmap.ts';
const u=(n:number)=>n&65535;
/** Original EGA opaque software text draws every stored glyph bit, including
 * padding, and advances rows by the active stride. Final controller writes
 * occur even when drawing into software planes. */
export function* drawOriginalEgaDisplayFont(memory:Uint8Array,d:number,text:number,x:number,y:number,opaque=true,continueCursor=false):Generator<OriginalEgaBitmapOperation,void,number>{
 const c=0x209e0,word=(base:number,at:number)=>memory[base+u(at)]|(memory[base+u(at+1)]<<8),put=(base:number,at:number,value:number)=>{memory[base+u(at)]=value&255;memory[base+u(at+1)]=(value>>>8)&255;},font=word(d,0x4dd2)*16;
 const hardware=word(c,0x9114)===0xa000,shared=(~(memory[font]^(opaque?memory[font+2]:0)))&255;
 if(!continueCursor){put(font,8,x);put(font,10,y);}
 if(hardware){yield {kind:'port-word',port:0x3ce,value:(shared<<8)|1};yield {kind:'port-word',port:0x3ce,value:(opaque?(memory[font]&memory[font+2])<<8:0)};}
 for(let guard=0;guard<65536;guard++){
  const code=memory[d+u(text++)];if(!code){yield {kind:'port-word',port:0x3ce,value:1};yield {kind:'port-word',port:0x3ce,value:0xff08};return;}
  let glyph=word(font,22+code*2);if(!glyph){if(code===10||code===13){put(font,8,word(font,4));put(font,10,word(font,10)+word(font,18));}continue;}
  const left=word(font,8),start=u(word(c,word(c,0x911c)+word(font,10)*2)+(left>>>3));
  if(memory[font+20]){const width=memory[font+glyph];glyph=u(glyph+1);put(font,16,width);if(!width&&opaque)continue;put(font,12,(width+7)>>>3);}
  const bytes=word(font,12),foreground=memory[font],background=memory[font+2];
  if(hardware)yield* drawOriginalEgaHardwareFontGlyph(memory,font,glyph,left,start,shared,opaque);
  else for(let plane=0;plane<4;plane++){const segment=word(c,0x9114+plane*2);if(!segment)continue;
   for(let row=0;row<Math.max(1,word(font,14)<<16>>16);row++)for(let pixel=0;pixel<bytes*8;pixel++){
    const on=memory[font+u(glyph+row*bytes+(pixel>>>3))]&(128>>>(pixel&7)),position=(left&7)+pixel,mask=128>>>(position&7),at=(segment*16+u(start+row*word(c,0x9126)+(position>>>3)))&0xfffff;
    if(!opaque&&!on)continue;
    if((on?foreground:background)&(1<<plane))memory[at]|=mask;else memory[at]&=~mask;
   }
  }
  put(font,8,left+word(font,16));
 }
 throw Error('Original EGA font string has no bounded terminator');
}
