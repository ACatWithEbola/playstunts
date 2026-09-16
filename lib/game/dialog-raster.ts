import {originalDialogContent} from './dialog-content.ts';
import {drawOriginalFont,measureOriginalFont} from './font-raster.ts';
/** Native supplied dialog drawing, with caller-owned framebuffer/background. */
export function drawOriginalDialog(target:Uint8Array,font:Uint8Array,text:ReadonlyArray<number>,selected:number,colors:{text:number;border:number;disabled:number},disabled?:ReadonlyArray<number>,mode=2,position:{x:number;y:number}={x:-1,y:-1}){
 const content=originalDialogContent(text,line=>measureOriginalFont(font,line),position.x,position.y,mode);
 const {layout}=content,rows=Array.from({length:256},(_,i)=>(i*320)&65535);
 // Original 26940 retains foreground/background in the selected font. The
 // subsequent path/name editor reads these words for its text and XOR cursor.
 const fontView=new DataView(font.buffer,font.byteOffset,font.byteLength),setColors=(foreground:number,background:number)=>{fontView.setUint16(0,foreground&255,true);fontView.setUint16(2,background&255,true);};
 const rect=(left:number,top:number,width:number,height:number,color:number)=>{
  for(let y=top;y<top+height;y++)for(let x=left;x<left+width;x++)target[(y*320+x)&65535]=color;
 };
 const [left,right,top,bottom]=layout.bounds;rect(left,top,right-left,bottom-top,0);
 const bx=layout.x-4,by=layout.y-4,br=layout.x+layout.innerWidth+4,bb=layout.y+layout.lineCount*10+4;
 rect(bx,by,br-bx+1,1,colors.border);rect(bx,bb,br-bx+1,1,colors.border);rect(bx,by,1,bb-by,colors.border);rect(br,by,1,bb-by,colors.border);
 setColors(colors.text,0);
 for(const line of content.lines)drawOriginalFont(target,font,String.fromCharCode(...line.text),line.x,line.y,colors.text,rows,0);
 for(const [index,choice] of (mode===2?content.choices:[]).entries()){
  const fg=disabled?.[index]?colors.disabled:index===selected?0:colors.text,bg=disabled?.[index]?0:index===selected?colors.text:0;
  const label=text.slice(choice.offset,choice.offset+choice.length);
  setColors(fg,bg);
  drawOriginalFont(target,font,String.fromCharCode(...label),choice.left,choice.top,fg,rows,bg);
 }
 return content;
}
