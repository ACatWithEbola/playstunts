import {i16,u16,intHypot3d,type Vector} from './math.ts';
/** Original0xae4a..0xaeeb preliminary rejection, not full car overlap. */
export function carsNear(a:Vector,b:Vector,radiusA:number,radiusB:number){
 const radius=i16(radiusA+radiusB);
 for(const axis of [0,2,1])if(i16(Math.max(i16(a[axis]),i16(b[axis]))-Math.min(i16(a[axis]),i16(b[axis])))>radius)return false;
 return u16(intHypot3d(a.map((v,i)=>i16(v-b[i])) as Vector))<=u16(radius);
}
