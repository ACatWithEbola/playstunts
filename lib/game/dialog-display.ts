import {originalDialogContent} from './dialog-content.ts';
import {measureOriginalFont} from './font-raster.ts';
export interface OriginalDialogDisplayHost {
 bounds(left:number,right:number,top:number,bottom:number):void;clearWindow(colour:number):void;
 rectangle(x:number,y:number,width:number,height:number,colour:number,clipped?:boolean):void;
 text(offset:number,x:number,y:number,opaque?:boolean):void;
}
/** Original dialog presentation through native alternative display backends. */
export function drawOriginalDialogDisplay(memory:Uint8Array,d:number,display:'cga'|'tandy'|'ega',host:OriginalDialogDisplayHost,text:readonly number[],selected:number,colors:{text:number;border:number;disabled:number},scratch:number,disabled?:readonly number[],mode=2,position={x:-1,y:-1}){
 const u=(n:number)=>n&65535,font=(memory[d+0x4dd2]|(memory[d+0x4dd3]<<8))*16,put=(at:number,value:number)=>{memory[font+at]=value&255;memory[font+at+1]=(value>>>8)&255;};
 const content=originalDialogContent(text,line=>measureOriginalFont(memory.subarray(font,font+65536),line),position.x,position.y,mode),{layout}=content;
 host.bounds(...layout.bounds as [number,number,number,number]);host.clearWindow(0);
 const bx=layout.x-4,by=layout.y-4,br=layout.x+layout.innerWidth+4,bb=layout.y+layout.lineCount*10+4;
 host.rectangle(bx,by,br-bx+1,1,colors.border);host.rectangle(bx,bb,br-bx+1,1,colors.border);host.rectangle(bx,by,1,bb-by,colors.border);host.rectangle(br,by,1,bb-by,colors.border);
 const draw=(bytes:readonly number[],x:number,y:number,foreground:number,background:number)=>{
  put(0,foreground&(display==='cga'?3:15));put(2,background&(display==='cga'?3:15));
  bytes.forEach((value,index)=>{memory[d+u(scratch+index)]=value;});memory[d+u(scratch+bytes.length)]=0;host.text(scratch,x,y,true);
 };
 put(0,colors.text&(display==='cga'?3:15));put(2,0);
 for(const line of content.lines)draw(line.text,line.x,line.y,colors.text,0);
 for(const [index,choice] of (mode===2?content.choices:[]).entries())draw(text.slice(choice.offset,choice.offset+choice.length),choice.left,choice.top,disabled?.[index]?colors.disabled:index===selected?0:colors.text,disabled?.[index]?0:index===selected?colors.text:0);
 return content;
}
