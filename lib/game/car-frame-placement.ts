import type {Vector} from '../physics/math.ts';
import {originalCarTilePlacement} from './car-tile-placement.ts';
import {originalCarDepthBias} from './car-depth-bias.ts';
/** Original four-corner selection followed by its conditional depth bias.
 * Caller supplies the original car and view matrices and retained stack bytes.
 */
export function originalCarFramePlacement(corners:Vector[],matrix:number[],world:Vector,lookahead:readonly (readonly number[])[],skip:readonly number[],camera:readonly number[],retainedRow:number,surfaces:readonly number[],viewMatrix:number[],retainedBias:number){
 const placement=originalCarTilePlacement(corners,matrix,world,lookahead,skip,camera,retainedRow);
 return {...placement,depthBias:originalCarDepthBias(placement.corner,surfaces,matrix,viewMatrix,retainedBias)};
}
