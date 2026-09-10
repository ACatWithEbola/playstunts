import {presentOriginalReplayBar} from './replay-bar-presentation.ts';
import {drawOriginalFont} from './font-raster.ts';

/** Original VGA replay bar over the retained game image. Resource lookup
 * supplies unchanged decoded SDGAME sprites for original far pointers. */
export function drawOriginalReplayBar(target:Uint8Array,memory:Uint8Array,d:number,start:number,current:number,font:Uint8Array,lookup:(offset:number,segment:number)=>ReadonlyArray<number>){
 const rows=Array.from({length:256},(_,i)=>(i*320)&65535);
 const put=(x:number,y:number,c:number)=>{if(x>=0&&x<320&&y>=0&&y<200)target[y*320+x]=c;};
 presentOriginalReplayBar(memory,d,start,current,{
  sprite(offset,segment){
   const frame=lookup(offset,segment),word=(o:number)=>frame[o]|frame[o+1]<<8,width=word(0),height=word(2),x=word(8)<<16>>16,y=word(10)<<16>>16;
   for(let row=0;row<height;row++)for(let col=0;col<width;col++)put(x+col,y+row,frame[16+row*width+col]);
  },
  // The source sets colors on the previous font before selecting this one.
  // Preserve this font's retained foreground/background instead.
  time(text,x,y){drawOriginalFont(target,font,text,x,y,font[0],rows,font[1]);},
  fill(x,y,width,height,color){for(let row=Math.max(y,0);row<Math.min(y+height,200);row++)for(let col=Math.max(x,0);col<Math.min(x+width,320);col++)put(col,row,color);},
  outline(left,top,right,bottom,color){
   for(let x=Math.max(left,0);x<=Math.min(right,319);x++){put(x,top,color);put(x,bottom,color);}
   for(let y=Math.max(top,0);y<=Math.min(bottom,199);y++){put(left,y,color);put(right,y,color);}
  },
 });
}
