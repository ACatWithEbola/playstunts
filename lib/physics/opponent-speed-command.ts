import {i16} from './math.ts';
/** Original 0x72f0..0x7334, before the engine update. */
export function opponentSpeedCommand(speed:number,targetByte:number,mode:number,demandedGrip:number,surfaceGrip:number,previous:number){
 if(i16(demandedGrip)>i16(surfaceGrip))return 2;
 const target=(mode&255)===2?0x4000:(targetByte&255)*256;
 if(((target-256)&65535)>(speed&65535))return 1;
 if(((target+768)&65535)<(speed&65535))return 2;
 return previous;
}
