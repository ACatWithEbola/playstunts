import {i16,vecTransform,type Vector} from './math.ts';
import {rotateZXY} from './rotation.ts';
/** MS91 89F8..8A94: body-height points, distinct from wheel contact points.
 * Wheel coordinates and pose position use long1/64-world-unit coordinates.
 * The returned retained cache uses signed16-bit world coordinates.
 */
export function bodyPlanePoints(position:Vector,rotation:Vector,wheels:readonly Vector[],height:number):Vector[]{
 if(wheels.length!==4)throw Error('Original body cache requires four coordinates');
 const matrix=rotateZXY(-rotation[2],-rotation[1],-rotation[0]);
 return wheels.map(wheel=>{
  const local:Vector=[wheel[0],i16(height<<6),wheel[2]],world=vecTransform(local,matrix);
  return world.map((v,i)=>i16(((position[i]+v)|0)>>6)) as Vector;
 });
}
