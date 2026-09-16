import {i16,intSin,intCos} from './math.ts';
/** Original terrain0..6 at 0x10647..0x106fe, before track-object selection.
 * The raised height is supplied from original DS:0124 (450 in the reference).
 */
export function baseTerrain(terrain:number,x:number,z:number,raisedHeight:number){
 if(!Number.isInteger(terrain)||terrain<0||terrain>6)throw Error(`Terrain ${terrain} requires slope reconstruction`);
 let surface=4;const height=terrain===6?i16(raisedHeight):0;
 if(terrain===1)surface=5;
 else if(terrain>=2&&terrain<=5){
  const angle=[128,-640,-384,-128][terrain-2];
  const rounded=(a:number,b:number)=>i16((i16(a)*i16(b)+8192)>>14);
  if(i16(rounded(intSin(angle),z)+rounded(intCos(angle),x))<0)surface=5;
 }
 return {surface,height};
}
