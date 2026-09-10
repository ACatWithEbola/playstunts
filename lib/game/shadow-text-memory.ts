import {drawOriginalFontMemory} from './draw-font-memory.ts';
/** Original1B2D2 text shadow and returned bounds, using the active font. */
export function drawOriginalShadowText(m:Uint8Array,d:number,text:number,x:number,y:number,color:number,shadow:number){
 const v=new DataView(m.buffer,m.byteOffset,m.byteLength),u=(n:number)=>n&65535,word=(base:number,at:number)=>v.getUint16(base+u(at),true),set=(base:number,at:number,n:number)=>v.setUint16(base+u(at),u(n),true),font=word(d,0x4dd2)*16;
 let width=0;
 for(let i=0;i<65536;i++){const code=m[d+u(text+i)];if(!code)break;const glyph=word(font,22+code*2);if(glyph)width=u(width+(m[font+20]?m[font+glyph]:word(font,16)));}
 set(d,0x6906,y);set(d,0x6908,y+word(d,0xa004)+1);set(d,0x6902,x);set(d,0x6904,x+width+1);
 set(font,0,shadow&255);set(font,2,0);drawOriginalFontMemory(m,d,text,u(x+1),u(y+1),0x209e0,false);
 set(font,0,color&255);set(font,2,0);drawOriginalFontMemory(m,d,text,x,y,0x209e0,false);return 0x6902;
}
