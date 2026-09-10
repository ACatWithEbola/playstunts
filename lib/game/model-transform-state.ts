import {i16,vecTransform,type Vector} from '../physics/math.ts';
import {multiply,transpose,rotateZXY,type Matrix} from '../physics/rotation.ts';
import {originalModelFacingBucket} from './model-facing-bucket.ts';
/** Supplied 16B52..16C9C: camera/model transforms and original face masks. */
export function originalModelTransformState(position:Vector,rotation:Vector,view:Matrix,flags:number,width:number,ratios:readonly number[],masks:readonly number[],beforeBucket:number){
 const matrix=multiply(rotateZXY(...rotation),view);
 const translation=(flags&2)?position.map(i16) as Vector:vecTransform(position,view);
 let bucket=beforeBucket&255,includeMask=0xffffffff,excludeMask=0;
 if(!(flags&2)){
  const direction=vecTransform([0,0,4096],transpose(matrix));
  const close=i16(width*2)>i16(Math.abs(translation[0]))&&i16(width*2)>i16(Math.abs(translation[2]));
  if(!(direction[1]>0&&i16(position[1])<0)&&!close){
   bucket=originalModelFacingBucket(direction,ratios);
   if(masks[bucket]===undefined)throw Error('Missing original directional face mask');
   includeMask=excludeMask=masks[bucket]>>>0;
  }
 }
 return {matrix,translation,includeMask,excludeMask,bucket};
}
