import {editorMapDraw} from './editor-map-draw.ts';
import {drawEditorRaster,type EditorRasterOperation} from './editor-raster.ts';
import {drawEditorClippedRaster} from './editor-clipped-raster.ts';
/** Original caller 0x1cab4..0x1cacc, including clipping setter 0x250b3. */
export const editorMapClip=Object.freeze({left:8,right:200,top:4,bottom:179});
/** Compose recovered map scheduling and raster operations with caller clipping state. */
export function renderEditorMap(target:Uint8Array,track:number[],terrain:number[],origin:number[],objects:{multiTile:number}[],art:{small:string;large:string}[],terrainNames:string[],images:Record<string,{width:number;height:number;pixels:ArrayLike<number>}>,clip:{left:number;right:number;top:number;bottom:number}=editorMapClip){
 const operations:Record<string,EditorRasterOperation>={'0x25b64':'copy','0x25852':'and','0x26046':'or','0x259f0':'copy','0x256c4':'and','0x25eb8':'or'};
 for(const command of editorMapDraw(track,terrain,origin,objects)){
  // Fully clipped off-grid terrain needs no bitmap lookup. Its source read
  // can reach adjacent memory, but contributes no visible pixels.
  const clipped=['0x259f0','0x256c4','0x25eb8'].includes(command.routine);
  if(clipped&&(((command.x<<16)>>16)>=clip.right||((command.y<<16)>>16)>=clip.bottom))continue;
  const name=command.table==='terrain'?terrainNames[command.tile]:art[command.tile][command.table];
  const image=images[name];if(!image)throw Error(`Missing editor artwork: ${name}`);
  const operation=operations[command.routine];
  if(clipped)drawEditorClippedRaster(target,320,image,command.x,command.y,operation,clip);
  else drawEditorRaster(target,320,image,command.x,command.y,operation);
 }
}
