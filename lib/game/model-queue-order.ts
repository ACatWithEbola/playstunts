import {i16} from '../physics/math.ts';
/** Supplied 28A1C..28AB1: descending signed-word Shell sort, carrying the
 * model indices with each swap. Equal depths can move indirectly between gaps;
 * a stable JavaScript sort does not preserve the original tie behavior.
 */
export function sortOriginalModelQueue(depths:readonly number[],indices:readonly number[]){
 if(depths.length!==indices.length||depths.length>32767)throw Error('Invalid original model queue');
 const values=depths.map(i16),order=indices.map(n=>n&65535),count=values.length;
 for(let gap=Math.trunc(count/2);gap>0;gap=Math.trunc(gap/2)){
  for(let i=gap;i<count;i++)for(let j=i-gap;j>=0&&values[j+gap]>values[j];j-=gap){
   [values[j],values[j+gap]]=[values[j+gap],values[j]];
   [order[j],order[j+gap]]=[order[j+gap],order[j]];
  }
 }
 return {depths:values,indices:order};
}

/** E780..E7DA: transform a model's origin and add its signed depth bias. The
 * original truncates each matrix product separately before adding the terms.
 */
export function originalModelQueueDepth(position:readonly number[],matrix:readonly number[],bias:number){
 if(position.length!==3||matrix.length!==9)throw Error('Invalid original model transform');
 let depth=0;
 for(let axis=0;axis<3;axis++)depth+=Math.imul(i16(matrix[axis*3+2]),i16(position[axis]))>>14;
 return i16(depth+i16(bias));
}
