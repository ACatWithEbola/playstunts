import {i16,intSin,intCos,type Vector} from '../physics/math.ts';
/** Supplied 13A95..13B01: place the player in the transporter before rollout. */
export function originalStartTruckEntry(position:Vector,heading:number){
 const offset=(trig:number)=>i16((Math.imul(-240,trig)+8192)>>14)*64;
 return {position:[(position[0]+offset(intSin(heading)))|0,(position[1]+1408)|0,(position[2]+offset(intCos(heading)))|0] as Vector,mode:1,flags:1};
}
