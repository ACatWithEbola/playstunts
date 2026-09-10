import {selectOriginalRenderTiles,type RenderTileSlots} from './select-render-tiles.ts';
import {prepareOriginalStaticTile} from './prepare-static-tile.ts';
/** Original selected slots are submitted in ascending order (DC35..DC64).
 * Dynamic objects and cars must be inserted before each tile's queue is drained.
 */
export function prepareOriginalStaticFrame(memory:Uint8Array,d:number,heading:number,cameraTile:readonly number[],carTile:readonly number[],threshold:number,retained:RenderTileSlots,paint:number,camera:readonly number[]){
 const slots=selectOriginalRenderTiles(memory,d,heading,cameraTile,carTile,threshold,retained);
 const tiles=[];
 for(let index=0;index<23;index++)if(slots.skip[index]===0){
  tiles.push({index,column:slots.east[index],row:slots.south[index],submissions:prepareOriginalStaticTile(memory,d,slots.tile[index],slots.terrain[index],slots.east[index],slots.south[index],slots.detail[index],paint,camera)});
 }
 return {slots,tiles};
}
