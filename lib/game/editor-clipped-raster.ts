import type {EditorRasterOperation} from './editor-raster.ts';
/** Original clipped copy/AND/OR; right and bottom clipping limits are exclusive. */
export function drawEditorClippedRaster(target:Uint8Array,stride:number,image:{width:number;height:number;pixels:ArrayLike<number>},x:number,y:number,operation:EditorRasterOperation,clip:{left:number;right:number;top:number;bottom:number}){
 x=(x<<16)>>16;y=(y<<16)>>16;
 const left=Math.max(x,clip.left),top=Math.max(y,clip.top),right=Math.min(x+image.width,clip.right),bottom=Math.min(y+image.height,clip.bottom);
 if(left>=right||top>=bottom)return;
 const width=right-left;
 // With no horizontal source skip, the original width-one fast path increases
 // its destination row increment on every iteration (all three operations).
 const drift=width===1&&image.width===1;
 for(let row=0;row<bottom-top;row++)for(let column=0;column<width;column++){
  const index=(top+row)*stride+left+column+(drift?row*(row-1)/2:0);
  const source=(top-y+row)*image.width+left-x+column;
  if(index<0||index>=target.length||source<0||source>=image.pixels.length)throw Error('Clipped editor raster outside buffers');
  const value=image.pixels[source];
  if(operation==='copy')target[index]=value;
  else if(operation==='and')target[index]&=value;
  else target[index]|=value;
 }
}
