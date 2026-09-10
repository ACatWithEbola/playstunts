import {rotateZXY} from '../physics/rotation.ts';
import {i16,intAtan2,vecTransform,type Vector} from '../physics/math.ts';
/** Supplied BFC4..C088, before the original terrain clearance adjustment. */
export function originalOrbitCameraPlacement(position:Vector,rotation:Vector,distance:number,azimuth:number,elevation:number):Vector{
 const forward=vecTransform([0,0,16384],rotateZXY(-rotation[2],-rotation[1],-rotation[0]));
 const angle=intAtan2(forward[0],forward[2]);
 const offset=vecTransform([0,0,i16(distance)],rotateZXY(0,-elevation,i16(angle-azimuth)));
 return position.map((n,i)=>i16(n+offset[i])) as Vector;
}
