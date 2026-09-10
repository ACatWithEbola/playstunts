import {i16,type Vector} from './math.ts';
import {rotateZXY} from './rotation.ts';
/** Original 0x6e78..0x6ef0 and 0x6fbf..0x6fda. Rotation is heading,pitch,roll. */
export function opponentPose(position:Vector,playerPosition:Vector,rotation:Vector){
 const convert=(v:Vector)=>v.map(value=>i16(value>>6)) as Vector;
 return {position:convert(position),player:convert(playerPosition),matrix:rotateZXY(rotation[2],rotation[1],rotation[0],true)};
}
