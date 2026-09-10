import {drawOriginalFont,measureOriginalFont} from './font-raster.ts';
/** Supplied options entry56bf..5759, before the first saved dialog. */
export function drawOriginalOptionsBackground(target:Uint8Array,font:Uint8Array,resources:Record<string,ReadonlyArray<number>>){
 target.fill(9,0,64000);const rows=Array.from({length:256},(_,i)=>(i*320)&65535);
 for(const [name,y] of [['gstu',6],['gver',16]] as const){
  const text=resources[name],x=Math.trunc((320-measureOriginalFont(font,text))/2);
  const label=String.fromCharCode(...text);
  drawOriginalFont(target,font,label,x+1,y+1,0,rows);
  drawOriginalFont(target,font,label,x,y,15,rows);
 }
}
