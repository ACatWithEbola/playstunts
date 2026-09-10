export type EditorRasterOperation='copy'|'and'|'or';
/** Original un-clipped byte-pixel routines 0x25b64,0x25852,0x26046.
 * Bounds are checked by the native caller boundary, not clipped or wrapped.
 */
export function drawEditorRaster(target:Uint8Array,stride:number,image:{width:number;height:number;pixels:ArrayLike<number>},x:number,y:number,operation:EditorRasterOperation){
 const {width,height,pixels}=image;
 if(![stride,width,height,x,y].every(Number.isInteger)||stride<=0||width<=0||height<=0||x<0||y<0||x+width>stride||(y+height-1)*stride+x+width>target.length||pixels.length<width*height||(width===1&&operation==='and'&&(y+height-1)*stride+x+1>=target.length))throw Error('Editor raster lies outside its buffers');
 for(let row=0;row<height;row++)for(let column=0;column<width;column++){
  const index=(y+row)*stride+x+column,value=pixels[row*width+column];
  if(operation==='copy')target[index]=value;
  else if(operation==='and')target[index]&=value;
  else target[index]|=value;
  // Original width-one path ANDs a word after LODSB, with AH still zero.
  if(width===1&&operation==='and')target[index+1]=0;
 }
}
