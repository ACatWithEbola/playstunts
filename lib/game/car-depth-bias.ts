import {i16,vecTransform} from '../physics/math.ts';
/** Supplied C870..C8E0: retain bias for unmatched or four surface-4 corners.
 * Otherwise project the car's up vector twice using original word arithmetic.
 */
export function originalCarDepthBias(corner:number,surfaces:readonly number[],carMatrix:number[],viewMatrix:number[],before:number):number{
 if(surfaces.length!==4)throw Error('Original car depth bias requires four surfaces');
 if(i16(corner)===-1||surfaces.every(v=>(v&255)===4))return i16(before);
 return vecTransform(vecTransform([0,30000,0],carMatrix),viewMatrix)[2]>0?2048:-2048;
}
