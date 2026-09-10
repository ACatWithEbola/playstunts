import {i16,intAtan2,intHypot,type Vector} from '../physics/math.ts';
/** Original C119..C16E, after ground clearance. */
export function originalExternalCameraAngles(car:Vector,camera:Vector){
 const x=i16(car[0]-camera[0]),z=i16(car[2]-camera[2]);
 return {heading:(-intAtan2(x,z))&1023,pitch:intAtan2(i16(car[1]-camera[1]+50),intHypot(x,z))&1023};
}
