import {drawOriginalFont,measureOriginalFont} from './font-raster.ts';
/** Original 1b616..1b893: three-pixel bevel, inclusive outer edges,
 * eight-pixel label rows, and truncation toward zero when centering. */
export function drawOriginalMenuButton(target:Uint8Array,font:Uint8Array,label:ReadonlyArray<number>|null,x:number,y:number,width:number,height:number,light:number,dark:number,fill:number,text:number){
 const put=(x:number,y:number,color:number)=>{if(x>=0&&x<320&&y>=0&&y<200)target[y*320+x]=color;};
 for(let row=y;row<y+height;row++)for(let col=x;col<x+width;col++)put(col,row,fill);
 for(let inset=0;inset<3;inset++){
  for(let col=x+inset;col<=x+width-inset;col++)put(col,y+inset,light);
  for(let row=y+inset;row<=y+height-inset;row++)put(x+inset,row,light);
 }
 for(let inset=0;inset<3;inset++){
  for(let col=x+inset;col<=x+width-inset;col++)put(col,y+height-inset,dark);
  for(let row=y+inset;row<=y+height-inset;row++)put(x+width-inset,row,dark);
 }
 if(label===null)return;
 const zero=label.indexOf(0),bytes=zero<0?Array.from(label):label.slice(0,zero),lines=String.fromCharCode(...bytes).split(']'),top=y+Math.trunc((height-lines.length*8)/2)+1,rows=Array.from({length:256},(_,i)=>(i*320)&65535);
 for(const [index,line] of lines.entries())drawOriginalFont(target,font,line,x+Math.trunc((width-measureOriginalFont(font,Array.from(line,c=>c.charCodeAt(0))))/2),top+index*8,text,rows);
}
