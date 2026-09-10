import {vecTransform,type Vector} from '../physics/math.ts';
/** Supplied C82C..C868: rotate corner, add fixed-point world position, then
 * take signed tile bytes. Original map rows reverse world Z numbering.
 */
export function originalCarCornerTile(corner:Vector,matrix:number[],world:Vector):[number,number]{
 const transformed=vecTransform(corner,matrix),signed=(n:number)=>n<<24>>24;
 return [signed(((transformed[0]+world[0])|0)>>16),signed(29-(((transformed[2]+world[2])|0)>>16))];
}
