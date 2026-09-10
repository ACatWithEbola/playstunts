/** Fixed-point rotation support recovered from Restunts math.c.
 * Arrays are column-major; multiply(right,left) returns left * right.
 * Each product is truncated before addition, as in the original routines.
 */
import { i16,intSin,intCos,vecTransform,type Vector } from './math.ts';
export type Matrix=[number,number,number,number,number,number,number,number,number];
export function multiply(right:Matrix,left:Matrix):Matrix {
 return [0,1,2].flatMap(column=>vecTransform(right.slice(column*3,column*3+3) as Vector,left)) as Matrix;
}
export function transpose(m:Matrix):Matrix{return [m[0],m[3],m[6],m[1],m[4],m[7],m[2],m[5],m[8]]}
export function rotateX(angle:number):Matrix {const c=intCos(angle),s=intSin(angle);return [16384,0,0,0,c,s,0,i16(-s),c]}
export function rotateY(angle:number):Matrix {const c=intCos(angle),s=intSin(angle);return [c,0,i16(-s),0,16384,0,s,0,c]}
export function rotateZ(angle:number):Matrix {const c=intCos(angle),s=intSin(angle);return [c,s,0,i16(-s),c,0,0,0,16384]}
export function rotateZXY(z:number,x:number,y:number,reverse=false):Matrix {
 const rz=rotateZ(z),rx=rotateX(x),ry=rotateY(y);
 return reverse?multiply(multiply(ry,rx),rz):multiply(multiply(rz,rx),ry);
}
