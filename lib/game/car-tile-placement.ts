import {originalCarCornerTile} from './car-corner-tile.ts';
import {selectOriginalCarCornerTile} from './car-tile-selection.ts';
import type {Vector} from '../physics/math.ts';
/** Supplied C789..C86E: all four corners share the highest matched slot.
 * Equal slots retain the earlier corner; the unmatched row is caller-owned.
 */
export function originalCarTilePlacement(corners:Vector[],matrix:number[],world:Vector,lookahead:readonly (readonly number[])[],skip:readonly number[],camera:readonly number[],retainedRow:number){
 if(corners.length!==4)throw Error('Original car placement requires four corners');
 let state={index:-1,corner:-1,column:255,row:retainedRow&255};
 for(let i=0;i<4;i++)state=selectOriginalCarCornerTile(lookahead,skip,camera,originalCarCornerTile(corners[i],matrix,world),i,state);
 return state;
}
