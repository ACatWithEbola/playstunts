/** Original263F0 opaque proportional text drawing through the retained font
 * segment. Glyph widths, byte stride and final cursor remain in that font. */
export function drawOriginalFontMemory(m:Uint8Array,d:number,text:number,x:number,y:number,cs=0x209e0,opaque=true){
 const v=new DataView(m.buffer,m.byteOffset,m.byteLength),u=(n:number)=>n&65535,word=(base:number,at:number)=>v.getUint16(base+u(at),true),set=(base:number,at:number,n:number)=>v.setUint16(base+u(at),u(n),true);
 const font=word(d,0x4dd2)*16,destination=word(cs,0x5d96)*16;set(font,8,x);set(font,10,y);
 for(let guard=0;guard<65536;guard++){
  const code=m[d+u(text++)];if(!code)return;
  let glyph=word(font,22+code*2);
  if(!glyph){if(code===10||code===13){set(font,8,word(font,4));set(font,10,word(font,10)+word(font,18));}continue;}
  const left=word(font,8);
  if(m[font+20]){const width=m[font+glyph];glyph=u(glyph+1);set(font,16,width);m[font+12]=(width+7)>>>3;}
  const foreground=m[font],background=m[font+2];let row=u(word(font,10)*2+word(cs,0x5d9e));
  for(let line=0;line<Math.max(1,word(font,14)<<16>>16);line++){
   let at=u(word(cs,row)+left);
   for(let byte=0;byte<Math.max(1,m[font+12]<<24>>24);byte++){
    const bits=m[font+glyph];glyph=u(glyph+1);
    for(let bit=0;bit<8;bit++){if(bits&(128>>bit))m[destination+at]=foreground;else if(opaque)m[destination+at]=background;at=u(at+1);}
   }
   row=u(row+2);
  }
  set(font,8,word(font,8)+word(font,16));
 }
 throw Error('Original font string has no bounded terminator');
}
