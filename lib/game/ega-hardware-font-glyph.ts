import type {OriginalEgaBitmapOperation} from './ega-display-bitmap.ts';
const u=(n:number)=>n&65535,rotate=(value:number,shift:number)=>u((value>>>shift)|(value<<(16-shift)));
/** Original EGA28AF3 hardware glyph loops. The host owns set/reset, map masks
 * and latches; every source read-modify-write cycle remains explicit. */
export function* drawOriginalEgaHardwareFontGlyph(memory:Uint8Array,font:number,glyph:number,left:number,start:number,shared:number,opaque=true):Generator<OriginalEgaBitmapOperation,void,number>{
 const c=0x209e0,word=(base:number,at:number)=>memory[base+u(at)]|(memory[base+u(at+1)]<<8),bytes=word(font,12),height=Math.max(1,word(font,14)<<16>>16),width=word(font,16),shift=left&7,stride=word(c,0x9126),foreground=memory[font],background=memory[font+2],aligned=!shift&&!(width&7);
 yield {kind:'port-word',port:0x3c4,value:((foreground|shared)<<8)|2};
 if(!opaque){
  let source=glyph;const edge=rotate(255,shift);
  for(let row=0;row<height;row++)for(let byte=0;byte<(bytes||65536);byte++){
   const offset=u(start+row*stride+byte),value=memory[font+u(source++)];
   if(!shift){yield {kind:'read',offset};yield {kind:'port-word',port:0x3ce,value:(value<<8)|8};yield {kind:'write',offset,value};}
   else{const rotated=rotate(value,shift),low=rotated&255,high=rotated>>>8;
    yield {kind:'port-word',port:0x3ce,value:(((edge&255)&low)<<8)|8};yield {kind:'read',offset};yield {kind:'write',offset,value:low};
    const next=u(offset+1);yield {kind:'port-word',port:0x3ce,value:(((edge>>>8)&high)<<8)|8};yield {kind:'read',offset:next};yield {kind:'write',offset:next,value:high};
   }
  }
  return;
 }

 if(aligned)yield {kind:'port-word',port:0x3ce,value:0xff08};
 const tailFlag=(((shift+(width&255))&255)>=((bytes*8)&255)),masks=width>8?[rotate(255,shift)&255,rotate(255,(shift+width)&7)>>>8]:(()=>{const pattern=rotate(memory[c+0x7eb4+width],shift);return [pattern&255,pattern>>>8];})();
 for(let pass=0;pass<(((foreground^background)&background)?2:1);pass++){
  if(pass)yield {kind:'port-word',port:0x3c4,value:((background|shared)<<8)|2};let source=glyph;
  for(let row=0;row<height;row++){
   let offset=u(start+row*stride);
   if(aligned){for(let byte=0;byte<(bytes||65536);byte++){const value=memory[font+u(source++)]^(pass?255:0);yield {kind:'read',offset};yield {kind:'write',offset,value};offset=u(offset+1);}continue;}
   let rotated=rotate(memory[font+u(source++)]^(pass?255:0),shift),carry=rotated>>>8;
   yield {kind:'port-word',port:0x3ce,value:(masks[0]<<8)|8};yield {kind:'read',offset};yield {kind:'write',offset,value:rotated&255};offset=u(offset+1);
   if((bytes&255)>1){yield {kind:'port-word',port:0x3ce,value:0xff08};for(let byte=1;byte<(bytes&255);byte++){
    rotated=rotate(memory[font+u(source++)]^(pass?255:0),shift);const value=(rotated&255)|carry;
    if(byte===(bytes&255)-1&&!tailFlag){carry=value;break;}
    carry=rotated>>>8;yield {kind:'read',offset};yield {kind:'write',offset,value};offset=u(offset+1);
   }}
   yield {kind:'port-word',port:0x3ce,value:(masks[1]<<8)|8};yield {kind:'read',offset};yield {kind:'write',offset,value:carry};
  }
 }
}
