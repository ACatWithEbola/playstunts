import {routeVector} from './route-vector.ts';
/** Original gettlistpoint 0xac70..0xacb4, including its out-of-line rotations. */
export function rotateRoutePointPair(first:number[],second:number[],rotation:number){
 const vectors=[first,second];
 return {first:routeVector(vectors,0,rotation),second:routeVector(vectors,1,rotation)};
}
