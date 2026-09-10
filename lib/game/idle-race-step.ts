import {i16,intSin,intCos,type Vector} from '../physics/math.ts';
export interface IdleRaceState {mode:number;phase:number;radius:number;position:Vector;speed:number;startX:number;startZ:number;startAngle:number}
/** Original inactive-race branch 972e..9819. Audio precedes any optional player update. */
export function idleRaceStep(before:IdleRaceState){
 let phase=before.phase&255,radius=before.radius&65535,command:0|1|2|null=null;
 const audio=(before.mode&255)===1;
 if(audio&&phase){
  if(i16(radius)<450)radius=(radius+8)&65535;
  if(phase===1&&i16(radius)>384)phase=2;
  if(phase===2){
   const product=(n:number,trig:number)=>i16((Math.imul(n,trig)+8192)>>14);
   const z=i16(before.startZ-i16(before.position[2]>>6)),x=i16(before.startX-i16(before.position[0]>>6));
   const crossing=i16(product(z,intCos(before.startAngle))+product(x,intSin(before.startAngle)));
   if(crossing>228)command=(before.speed&65535)<1280?1:0;
   else if(before.speed&65535)command=2;
   else phase=0;
  }
 }
 return {phase,radius,command,audio};
}
