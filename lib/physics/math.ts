/** Native browser reconstruction of Stunts fixed-point math.
 * Reference: dstien/restunts2 src/c/math.c, commit 4272c664817baa906034cc86a09dbd4b9d1c2593.
 * This module is not yet a driving simulation. Keep integer truncation and wrapping.
 * Angles: 1024 per revolution. Trig: Q14. Matrix storage: column-major.
 */
import { sine_table,atan_table } from './tables.ts';
export const i16=(v:number)=>(v<<16)>>16;
export const u16=(v:number)=>v&65535;
export function intSin(a:number){a=u16(a);const step=a&255;switch((a>>8)&3){case 0:return sine_table[step];case 1:return sine_table[256-step];case 2:return (-sine_table[step])|0;default:return (-sine_table[256-step])|0}}
export function intCos(a:number){return intSin(a+256)}
export function intAtan2(x:number,y:number){x=i16(x);y=i16(y);if((x===-32768)!==(y===-32768))return 0;let oct=0,result:number;if(x<0){oct+=4;x=i16(-x)}if(y<0){oct+=2;y=i16(-y)}if(x===y){if(x===0)return 0;result=128}else{if(x>y){[x,y]=[y,x];oct++}const quotient=Math.floor(((x*65536)>>>0)/y);result=atan_table[(quotient+128)>>>8]}switch(oct){case 0:return result;case 1:return 256-result;case 2:return 512-result;case 3:return result+256;case 4:return (-result)|0;case 5:return result-256;case 6:return result-512;default:return -result-256}}
export function intHypot(x:number,y:number){x=i16(x);y=i16(y);let angle=intAtan2(x,y);if(angle<0)angle=-angle;if(angle>=256)angle=512-angle;if(angle<=128){if(y<0)y=i16(-y);return i16(Math.floor(((y*16384)>>>0)/intCos(angle)))}if(x<0)x=i16(-x);return i16(Math.floor(((x*16384)>>>0)/intSin(angle)))}
export type Vector=[number,number,number];
export function intHypot3d(v:Vector){return intHypot(intHypot(v[0],v[1]),v[2])}
export function vecTransform(v:Vector,m:number[]):Vector{if(m.length!==9)throw Error('A Stunts matrix has nine elements');return [0,1,2].map(row=>i16((Math.imul(i16(m[row]),i16(v[0]))>>14)+(Math.imul(i16(m[row+3]),i16(v[1]))>>14)+(Math.imul(i16(m[row+6]),i16(v[2]))>>14))) as Vector}
