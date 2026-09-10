import {i16} from '../physics/math.ts';
import {originalProjectedFaceVisible} from './projected-face-visible.ts';
/** Supplied 175A8..176BD: select one projected wheel face and its far center.
 * Any near-plane clipping flag suppresses this original wheel primitive.
 */
export function originalWheelProjection(points:readonly (readonly number[])[],depths:readonly number[],clipFlags:number){
 if(points.length!==6||depths.length!==6)throw Error('Original wheel primitive requires six vertices');
 if((clipFlags&65535)!==0)return null;
 const face=originalProjectedFaceVisible(points)?[0,1,2,3]:[3,4,5,0];
 return {points:face.map(index=>[i16(points[index][0]),i16(points[index][1])]),depth:i16(depths[face[0]])*4};
}
