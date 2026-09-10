import {measureOriginalFont} from './font-raster.ts';
export interface OriginalTextEntryDisplayHost {
 text(offset:number,x:number,y:number,opaque?:boolean):void;
 rectangle(x:number,y:number,width:number,height:number,colour:number,clipped?:boolean):void;
 xorRectangle(x:number,y:number,width:number,height:number,colour:number,clipped?:boolean):void;
}
/** Original field redraw and XOR cursor, with packed-driver colour expansion.
 * Width clipping edits the field before cursor positioning, as in the source. */
export function drawOriginalTextEntryDisplay(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:OriginalTextEntryDisplayHost,text:string,cursor:number,x:number,y:number,pixelWidth:number,cursorHeight:number,cursorVisible:boolean,scratch:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),font=v.getUint16(d+0x4dd2,true)*16,bytes=(s:string)=>Array.from(s,c=>c.charCodeAt(0)),measure=(s:string)=>measureOriginalFont(memory.subarray(font,font+65536),bytes(s));
 text=text.split('\0')[0];if(pixelWidth)while(text.length&&measure(text)>pixelWidth)text=text.slice(0,-1);cursor=Math.min(cursor,text.length);
 const pattern=(colour:number)=>(colour*(mode==='cga'?0x5555:mode==='tandy'?0x1111:1))&65535,foreground=pattern(v.getUint16(font,true)),background=pattern(v.getUint16(font+2,true)),height=v.getUint16(font+18,true);
 memory.set([...bytes(text),0],d+scratch);host.text(scratch,x,y,true);const width=measure(text);
 if(pixelWidth>width)host.rectangle(x+width,y,pixelWidth-width,height,background,false);
 if(cursorVisible){const cursorWidth=measure(text.slice(cursor,cursor+1))||measure(' ');host.xorRectangle(x+measure(text.slice(0,cursor)),y+height-cursorHeight,cursorWidth,cursorHeight,foreground);}
 return {text,cursor};
}
