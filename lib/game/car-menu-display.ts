import {drawOriginalMenuButtonDisplay,type OriginalMenuButtonDisplayHost} from './menu-button-display.ts';
export interface OriginalCarMenuDisplayHost extends OriginalMenuButtonDisplayHost {
 unclippedBitmap(pointer:{offset:number;segment:number}):void;point(x:number,y:number,colour:number):void;
}
/** Original47D6..4B62 lower car-selection panel; the caller provides the
 * selected driver's converted graph bitmap and original acceleration samples. */
export function drawOriginalCarMenuDisplay(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:OriginalCarMenuDisplayHost,resources:{graphBitmap:{offset:number;segment:number};labels:readonly (readonly number[])[];description:readonly number[];smallFontSegment:number;normalFontSegment:number;textScratch:number},graph:readonly {x:number;y:number}[]){
 const u=(n:number)=>n&65535,word=(at:number)=>memory[at]|(memory[at+1]<<8),put=(at:number,value:number)=>{memory[at]=value&255;memory[at+1]=(value>>>8)&255;};
 const button=(label:readonly number[]|null,x:number,y:number,width:number,height:number)=>drawOriginalMenuButtonDisplay(memory,d,host,label,x,y,width,height,word(d+0x4eb4),word(d+0x4eb6),word(d+0x4eb8),0,resources.textScratch);
 const text=(bytes:readonly number[],x:number,y:number)=>{bytes.forEach((value,index)=>{memory[d+u(resources.textScratch+index)]=value;});memory[d+u(resources.textScratch+bytes.length)]=0;host.text(resources.textScratch,x,y,false);};
 button(null,0,103,320,97);button(null,5,109,70,85);button(null,82,109,140,85);host.unclippedBitmap(resources.graphBitmap);
 put(d+0x4dd2,resources.smallFontSegment);put(resources.smallFontSegment*16,0);put(resources.smallFontSegment*16+2,word(d+0x4e8a)&(mode==='cga'?3:15));
 for(const [label,x,y] of [['150',9,115],['100',9,135],[' 50',9,155],['  0',9,175],['0  20  40',26,185]] as const)text(Array.from(label,ch=>ch.charCodeAt(0)),x,y);
 put(d+0x4dd2,resources.normalFontSegment);
 for(let index=0;index<5;index++)button(resources.labels[index],word(d+0x362)+1,word(d+0x376+2*index)+1,86,16);
 for(const point of graph)host.point(point.x,point.y,word(d+0x4ec0));
 put(d+0x4dd2,resources.smallFontSegment);
 let line:number[]=[],y=116;for(const code of resources.description){if(!code)break;if(code===93){if(line.length)text(line,88,y);line=[];y+=8;}else line.push(code);}
 put(d+0x4dd2,resources.normalFontSegment);
}
