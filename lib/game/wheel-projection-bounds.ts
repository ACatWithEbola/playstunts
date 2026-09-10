import {i16,intHypot} from '../physics/math.ts';
/** Supplied 176BE..177AB: signed radius selection and original exclusive
 * rectangle expansion for both wheel centers, retaining word overflow.
 */
export function originalWheelProjectionBounds(points:readonly (readonly number[])[],before:readonly number[]){
 if(points.length!==4||before.length!==4)throw Error('Original wheel bounds require four points and a rectangle');
 const radius=Math.max(intHypot(i16(points[0][0]-points[1][0]),i16(points[0][1]-points[1][1])),intHypot(i16(points[0][0]-points[2][0]),i16(points[0][1]-points[2][1])));
 const rectangle=before.map(i16);
 for(const center of [points[0],points[3]])for(const sign of [-1,1]){
  const x=i16(center[0]+sign*(radius+1)),y=i16(center[1]+sign*(radius+1));
  rectangle[0]=Math.min(rectangle[0],x);rectangle[1]=Math.max(rectangle[1],i16(x+1));rectangle[2]=Math.min(rectangle[2],y);rectangle[3]=Math.max(rectangle[3],i16(y+1));
 }
 return {radius,rectangle};
}
