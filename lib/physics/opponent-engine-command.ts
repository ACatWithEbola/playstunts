import {opponentSpeedCommand} from './opponent-speed-command.ts';
/** Original 0x72b8..0x7334, including contact, crash and wheel-angle gates. */
export function opponentEngineCommand(rearContact:number,crash:number,wheelAngle:number,roadSpeed:number,speed:number,targetByte:number,mode:number,demandedGrip:number,surfaceGrip:number){
 let command=0;roadSpeed&=65535;wheelAngle=(wheelAngle<<16)>>16;
 if(rearContact&255){
  if(crash&255)command=2;
  else if(wheelAngle){if(roadSpeed<512){roadSpeed=0;wheelAngle=0;}else roadSpeed-=512;}
  else command=opponentSpeedCommand(speed,targetByte,mode,demandedGrip,surfaceGrip,0);
 }
 return {command,roadSpeed,wheelAngle};
}
