import {rotateZXY} from '../physics/rotation.ts';
import {vecTransform,type Vector} from '../physics/math.ts';
/** Supplied executable C1BA..C210, then C052..C089. DS A53A is the
 * cockpit car height; the original eye is centered at height minus six.
 */
export function cockpitEyeOffset(rotation:Vector,carHeight:number):Vector{
 return vecTransform([0,carHeight-6,0],rotateZXY(-rotation[2],-rotation[1],-rotation[0]));
}
