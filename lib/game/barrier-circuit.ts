/** Original-format road barrier course used in the continuous comparison. */
export function barrierCircuit():number[]{
 const raw=Array<number>(1802).fill(0);
 for(let row=0;row<30;row++)raw[row*30+7]=4;
 raw[8*30+7]=115;
 return raw;
}
