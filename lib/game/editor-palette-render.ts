import {editorPaletteDraw} from './editor-palette-draw.ts';
import {drawEditorRaster,type EditorRasterOperation} from './editor-raster.ts';
export function renderEditorPalette(target:Uint8Array,page:number,pages:number[][],objects:{multiTile:number}[],art:{small:string;large:string}[],terrainNames:string[],images:Record<string,{width:number;height:number;pixels:ArrayLike<number>}>){
 const operations:Record<string,EditorRasterOperation>={'0x25b64':'copy','0x25852':'and','0x26046':'or'};
 for(const command of editorPaletteDraw(pages,page,objects)){
  const name=command.table==='terrain'?terrainNames[command.tile]:art[command.tile][command.table];
  const image=images[name];if(!image)throw Error(`Missing editor artwork: ${name}`);
  drawEditorRaster(target,320,image,command.x,command.y,operations[command.routine]);
 }
}
