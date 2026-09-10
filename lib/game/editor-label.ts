import {drawOriginalFont,measureOriginalFont} from './font-raster.ts';
/** Source 1ce38..1ceeb. Opaque text at the bottom left, followed by removal
 * of the previous label's excess width when the next label is shorter. */
export function drawOriginalEditorLabel(target:Uint8Array,font:Uint8Array,label:ReadonlyArray<number>,previousWidth:number,color:number){
 const end=label.indexOf(0),bytes=end<0?Array.from(label):label.slice(0,end),width=measureOriginalFont(font,bytes),rows=Array.from({length:256},(_,i)=>(i*320)&65535);
 drawOriginalFont(target,font,String.fromCharCode(...bytes),8,192,color,rows,0);
 if(previousWidth>width)for(let y=192;y<200;y++)for(let x=8+width;x<8+previousWidth;x++)target[(y*320+x)&65535]=0;
 return width;
}
