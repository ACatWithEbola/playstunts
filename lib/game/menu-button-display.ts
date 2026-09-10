import {measureOriginalFont} from './font-raster.ts';
export interface OriginalMenuButtonDisplayHost {rectangle(x:number,y:number,width:number,height:number,colour:number,clipped?:boolean):void;text(offset:number,x:number,y:number,opaque?:boolean):void;}
/** Original1B616..1B893 button composed through the selected native driver. */
export function drawOriginalMenuButtonDisplay(memory:Uint8Array,d:number,host:OriginalMenuButtonDisplayHost,label:readonly number[]|null,x:number,y:number,width:number,height:number,light:number,dark:number,fill:number,textColour:number,scratch:number){
 const u=(n:number)=>n&65535,word=(at:number)=>memory[at]|(memory[at+1]<<8),put=(at:number,value:number)=>{memory[at]=value&255;memory[at+1]=(value>>>8)&255;};
 const text=(bytes:readonly number[],tx:number,ty:number)=>{bytes.forEach((value,index)=>{memory[d+u(scratch+index)]=value;});memory[d+u(scratch+bytes.length)]=0;host.text(scratch,tx,ty,false);};
  host.rectangle(x,y,width,height,fill,false);
  for(let inset=0;inset<3;inset++){host.rectangle(x+inset,y+inset,width-2*inset+1,1,light);host.rectangle(x+inset,y+inset,1,height-2*inset+1,light);}
  for(let inset=0;inset<3;inset++){host.rectangle(x+inset,y+height-inset,width-2*inset+1,1,dark);host.rectangle(x+width-inset,y+inset,1,height-2*inset+1,dark);}
  if(label===null)return;
  const font=word(d+0x4dd2)*16;put(font,textColour);put(font+2,0);
  const zero=label.indexOf(0),bytes=zero<0?label:label.slice(0,zero),lines=String.fromCharCode(...bytes).split(']'),top=y+Math.trunc((height-lines.length*8)/2)+1;
  for(let line=0;line<lines.length;line++){const bytes=Array.from(lines[line],ch=>ch.charCodeAt(0)),length=measureOriginalFont(memory.subarray(font,font+65536),bytes);text(bytes,x+Math.trunc((width-length)/2),top+line*8);}
}
