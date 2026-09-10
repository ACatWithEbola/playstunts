const u=(n:number)=>n&65535;
/** Original opaque CGA/Tandy text. Font state is retained in its resource,
 * and drawing is unclipped. Aligned Tandy even-width glyphs draw stored padding. */
export function drawOriginalPackedDisplayFont(memory:Uint8Array,d:number,mode:'cga'|'tandy',text:number,x:number,y:number,opaque=true,continueCursor=false){
 const c=0x209e0,block=mode==='cga'?0x6864:0x63d4,units=mode==='cga'?4:2,bits=8/units,word=(base:number,at:number)=>memory[base+u(at)]|(memory[base+u(at+1)]<<8),put=(base:number,at:number,value:number)=>{memory[base+u(at)]=value&255;memory[base+u(at+1)]=(value>>>8)&255;},font=word(d,0x4dd2)*16,destination=word(c,block)*16,colours=mode==='cga'?(opaque?0x5744:0x5222):(opaque?0x587c:0x5338),foreground=word(d,colours+word(font,0)*2),background=word(d,colours+word(font,2)*2);
 if(!continueCursor){put(font,8,x);put(font,10,y);}
 for(let guard=0;guard<65536;guard++){
  const code=memory[d+u(text++)];if(!code)return;let glyph=word(font,22+code*2);
  if(!glyph){if(code===10||code===13){put(font,8,word(font,4));put(font,10,word(font,10)+word(font,18));}continue;}
  const left=word(font,8);if(memory[font+20]){const width=memory[font+glyph];glyph=u(glyph+1);put(font,16,width);put(font,12,(width+7)>>>3);}
  const width=word(font,16),aligned=!(left&(units-1))&&!(width&(mode==='cga'?7:1)),drawWidth=(!opaque||aligned)?word(font,12)*8:width,stride=(!opaque||aligned)?word(font,12):Math.ceil(width/8);
  for(let row=0;row<Math.max(1,word(font,14)<<16>>16);row++){
   const start=u(word(c,word(c,block+8)+(word(font,10)+row)*2)+(left>>>(mode==='cga'?2:1)));
   for(let pixel=0;pixel<drawWidth;pixel++){
    const pattern=memory[font+u(glyph+(pixel>>>3))]&(128>>>(pixel&7))?foreground:background,sourceShift=(units-1-(pixel%units))*bits,colour=(pattern>>>sourceShift)&((1<<bits)-1),position=(left&(units-1))+pixel,shift=(units-1-position%units)*bits,mask=((1<<bits)-1)<<shift,at=(destination+u(start+Math.floor(position/units)))&0xfffff;
    if(opaque||(memory[font+u(glyph+(pixel>>>3))]&(128>>>(pixel&7))))memory[at]=(memory[at]&~mask)|(colour<<shift);
   }
   glyph=u(glyph+stride);
  }
  put(font,8,left+width);
 }
 throw Error('Original packed font string has no bounded terminator');
}
