import {i16,vecTransform,intAtan2,type Vector} from './math.ts';
/** Original 0x6fee..0x7031: local direction to selected target, then integer atan2. */
export function opponentTargetAngle(target:Vector,position:Vector,matrix:number[]){
 const relative=target.map((v,i)=>i16(v-position[i])) as Vector;
 const local=vecTransform(relative,matrix);
 // The original atan(0,0) returns incoming AX unchanged. The preceding
 // transform leaves its final coefficient, or the shifted product's low word.
 const coefficient=i16(matrix[8]);
 const residual=coefficient&&relative[2]?i16(Math.imul(coefficient,relative[2])<<2):coefficient;
 return {local,angle:local[0]===0&&local[2]===0?residual:intAtan2(local[0],local[2])};
}
