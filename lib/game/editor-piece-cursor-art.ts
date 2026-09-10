import {drawEditorRaster} from './editor-raster.ts';
import type {EditorCursorImage} from './editor-cursor-render.ts';
/** Original track-page cursor preparation 0x1cbb0..0x1cc11. */
export function editorPieceCursorArt(tile:number,shape:number,art:{small:string;large:string}[],images:Record<string,EditorCursorImage>){
 const background=images['crs'+shape];if(!background)throw Error('Missing original cursor background');
 const {width,height}=background,pixels=Uint8Array.from(background.pixels);
 if(tile!==0){
  const mask=images[art[tile].large],piece=images[art[tile].small];
  if(!mask||!piece)throw Error('Missing original cursor piece artwork');
  drawEditorRaster(pixels,width,mask,0,0,'and');
  drawEditorRaster(pixels,width,piece,0,0,'or');
 }
 return {width,height,pixels};
}
