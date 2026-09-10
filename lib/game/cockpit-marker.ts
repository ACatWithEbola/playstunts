/** Original 0x15301-0x15335. Negative steering mirrors the byte coordinate
 * around the first table point; preserve byte wraparound.
 */
export function cockpitMarker(points:number[][],scaled:number){
 const point=points[Math.abs(scaled)];
 if(!point)throw Error('Steering marker outside original coordinate table');
 return {x:scaled<0?(2*points[0][0]-point[0])&255:point[0],y:point[1]};
}
