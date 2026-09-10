/** Original-format two-tile course used by the continuous comparison. */
export function verticalCorkscrewCircuit():number[]{
 const raw=Array<number>(1802).fill(0);
 for(let row=0;row<30;row++)raw[row*30+7]=4;
 raw[9*30+7]=85;
 raw[8*30+7]=254;
 return raw;
}
