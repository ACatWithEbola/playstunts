import {slopeRoadMap} from '../physics/slope-road-map.ts';
/** Supplied executable C4EB..C517: nonempty road tiles on straight slopes
 * replace the terrain model, even when the original substitution yields zero.
 */
export function hillRenderSelection(terrain:number,tile:number){
 if(tile!==0&&terrain>=7&&terrain<11)return {terrain:0,tile:slopeRoadMap(terrain,tile)};
 return {terrain,tile};
}
