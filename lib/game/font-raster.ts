/** Supplied 25576..25647. Original proportional glyph widths and MSB-first
 * bitmap rows; keep the 64 KiB destination so edge writes retain DOS wrapping.
 */
export function drawOriginalFont(target:Uint8Array,font:Uint8Array,text:string,x:number,y:number,color:number,rowOffsets:ReadonlyArray<number>,background?:number){
 if(target.length!==65536)throw Error('Original font target requires a 64 KiB segment');
 const v=new DataView(font.buffer,font.byteOffset,font.byteLength),height=v.getUint16(14,true),lineHeight=v.getUint16(18,true);
 let column=x&65535,row=y&65535;
 for(const character of text){const code=character.charCodeAt(0)&255;if(!code)break;let offset=v.getUint16(22+code*2,true);
  if(!offset){if(code===10||code===13){column=v.getUint16(4,true);row=(row+lineHeight)&65535;}continue;}
  const width=font[20]?font[offset++]:v.getUint16(16,true),stride=font[20]?Math.ceil(width/8):font[12];
  for(let line=0;line<height;line++){
   const base=rowOffsets[(row+line)&65535];if(base===undefined)throw Error('Original font row table is outside retained memory');
   for(let byte=0;byte<stride;byte++){const bits=font[offset++];for(let bit=0;bit<8;bit++)if(bits&(128>>bit))target[(base+column+byte*8+bit)&65535]=color;else if(background!==undefined)target[(base+column+byte*8+bit)&65535]=background;}
  }
  column=(column+width)&65535;
 }
 return {x:column,y:row};
}

/** Supplied 24679..246bb, including absent-glyph skipping and word wrapping. */
export function measureOriginalFont(font:Uint8Array,text:ReadonlyArray<number>){
 const view=new DataView(font.buffer,font.byteOffset,font.byteLength);let width=0;
 for(const raw of text){const code=raw&255;if(!code)break;const offset=view.getUint16(22+code*2,true);if(offset)width=(width+(font[20]?font[offset]:view.getUint16(16,true)))&65535;}
 return width;
}
