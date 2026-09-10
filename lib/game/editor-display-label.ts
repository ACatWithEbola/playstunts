import {measureOriginalFont} from './font-raster.ts';
import type {OriginalMenuButtonDisplayHost} from './menu-button-display.ts';
/** Original1CE38..1CEEC label, retaining signed previous-width comparison. */
export function drawOriginalEditorDisplayLabel(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:OriginalMenuButtonDisplayHost,label:readonly number[],previousWidth:number,colour:number,scratch:number){
 const u=(n:number)=>n&65535,word=(at:number)=>memory[at]|memory[at+1]<<8,font=word(d+0x4dd2)*16,zero=label.indexOf(0),bytes=zero<0?label:label.slice(0,zero),width=measureOriginalFont(memory.subarray(font,font+65536),bytes);
 colour&=mode==='cga'?3:15;memory[font]=colour&255;memory[font+1]=colour>>>8&255;memory[font+2]=memory[font+3]=0;
 bytes.forEach((value,index)=>{memory[d+u(scratch+index)]=value;});memory[d+u(scratch+bytes.length)]=0;host.text(scratch,8,192,true);
 if((previousWidth<<16>>16)>(width<<16>>16))host.rectangle(u(8+width),192,u(previousWidth-width),8,0,false);
 return width;
}
