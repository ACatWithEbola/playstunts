import {prepareOriginalStaticFrame} from './prepare-static-frame.ts';
import {prepareOriginalTrackSign} from './prepare-track-sign.ts';
import type {RenderTileSlots} from './select-render-tiles.ts';
import type {Particle} from './particles.ts';
import type {Vector} from '../physics/math.ts';
/** Track plus sign submissions. Cars still enter each tile before queue drain. */
export function prepareOriginalTrackFrame(memory:Uint8Array,d:number,heading:number,cameraTile:readonly number[],carTile:readonly number[],threshold:number,retained:RenderTileSlots,paint:number,camera:Vector,particles:readonly Particle[]){
 const frame=prepareOriginalStaticFrame(memory,d,heading,cameraTile,carTile,threshold,retained,paint,camera);
 for(const tile of frame.tiles)if(frame.slots.tile[tile.index]!==0){
  tile.submissions.push(...prepareOriginalTrackSign(memory,d,tile.column,tile.row,particles,camera));
 }
 return frame;
}
