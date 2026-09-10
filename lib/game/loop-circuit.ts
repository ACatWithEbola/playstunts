/** Original-format loop course verified with north-to-south standing starts. */
export function loopCircuit():number[]{
 const raw=Array<number>(1802).fill(0);
 for(let row=0;row<30;row++)raw[row*30+7]=4;
 raw[12*30+7]=64;raw[11*30+7]=254;
 return raw;
}
