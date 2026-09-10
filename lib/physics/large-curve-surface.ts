import {i16,intHypot} from './math.ts';
/** Original 0x10a26..0x10a4a and 0x10ab6..0x10aec. */
export function largeCurvePaved(physics:number,x:number,z:number):boolean{
 const mirrored=physics===9?i16(-x):x;
 const radius=intHypot(i16(mirrored+1024),i16(z+1024));
 return (radius>1416&&radius<1656)||(physics!==3&&mirrored>=392&&mirrored<=632);
}
