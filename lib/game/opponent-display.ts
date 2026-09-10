import {loadOriginalDisplayColourTables} from './display-colour-tables.ts';
import {drawOriginalMenuButtonDisplay} from './menu-button-display.ts';
export interface OriginalOpponentDisplayHost {
 clearWindow(colour:number):void;indexedSprite(pointer:{offset:number;segment:number}):void;
 rectangle(x:number,y:number,width:number,height:number,colour:number,clipped?:boolean):void;
 text(offset:number,x:number,y:number,opaque?:boolean):void;
}
/** Original51BB..5462 opponent-screen drawing, including per-portrait palettes.
 * Resources and text scratch belong to the caller's original address space. */
export function drawOriginalOpponentDisplay(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:OriginalOpponentDisplayHost,resources:{art:Record<string,{offset:number;segment:number}>;labels:readonly (readonly number[])[];description:readonly number[];smallFontSegment:number;textScratch:number},opponent:number){
 const u=(n:number)=>n&65535,word=(at:number)=>memory[at]|(memory[at+1]<<8),put=(at:number,value:number)=>{memory[at]=value&255;memory[at+1]=(value>>>8)&255;};
 const palette=(index:number)=>{const p=resources.art[(mode==='cga'?'!cg':'!eg')+index];loadOriginalDisplayColourTables(memory,d,mode,u(p.offset+16),p.segment);};
 const text=(bytes:readonly number[],x:number,y:number)=>{bytes.forEach((value,index)=>{memory[d+u(resources.textScratch+index)]=value;});memory[d+u(resources.textScratch+bytes.length)]=0;host.text(resources.textScratch,x,y,false);};
 host.clearWindow(0);palette(7);host.indexedSprite(resources.art.scrn);
 for(let index=0;index<5;index++){
  const x=21+56*index,y=u(word(d+0x402)+1),width=54,height=18,light=word(d+0x4eb4),dark=word(d+0x4eb6),fill=word(d+0x4eb8);
  drawOriginalMenuButtonDisplay(memory,d,host,resources.labels[index],x,y,width,height,light,dark,fill,0,resources.textScratch);
 }
 palette(opponent);host.indexedSprite(resources.art['opp'+opponent]);palette(7);host.indexedSprite(resources.art.clip);
 put(d+0x4dd2,resources.smallFontSegment);const font=resources.smallFontSegment*16;put(font,0);put(font+2,word(d+0x4e8a)&(mode==='cga'?3:15));
 let line:number[]=[],y=33;for(const code of resources.description){if(!code)break;if(code===93){if(line.length)text(line,12,y);line=[];y+=8;}else line.push(code);}
}
