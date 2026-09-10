import {drawOriginalFont,measureOriginalFont} from './font-raster.ts';
/** Supplied 2c2cc field redraw followed by 2c22c XOR cursor. Width clipping
 * mutates the original field by removing trailing bytes, then clamps the cursor.
 */
export function drawOriginalTextEntry(target:Uint8Array,font:Uint8Array,text:string,cursor:number,x:number,y:number,pixelWidth:number,cursorHeight:number,cursorVisible=true){
 const bytes=(s:string)=>Array.from(s,c=>c.charCodeAt(0)),measure=(s:string)=>measureOriginalFont(font,bytes(s));
 text=text.split('\0')[0];if(pixelWidth)while(text.length&&measure(text)>pixelWidth)text=text.slice(0,-1);
 cursor=Math.min(cursor,text.length);
 const view=new DataView(font.buffer,font.byteOffset,font.byteLength),foreground=font[0],background=font[2],lineHeight=view.getUint16(18,true),rows=Array.from({length:256},(_,i)=>(i*320)&65535);
 drawOriginalFont(target,font,text,x,y,foreground,rows,background);
 const width=measure(text);
 if(pixelWidth>width)for(let row=y;row<y+lineHeight;row++)for(let col=x+width;col<x+pixelWidth;col++)target[(row*320+col)&65535]=background;
 if(cursorVisible){
  const cursorWidth=measure(text.slice(cursor,cursor+1))||measure(' '),left=x+measure(text.slice(0,cursor)),top=y+lineHeight-cursorHeight;
  for(let row=top;row<top+cursorHeight;row++)for(let col=left;col<left+cursorWidth;col++)target[(row*320+col)&65535]^=foreground;
 }
 return {text,cursor};
}
