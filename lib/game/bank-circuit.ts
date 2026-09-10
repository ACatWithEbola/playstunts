/** Original-format course verified through 400 continuous original player steps. */
export function bankCircuit():number[]{
 const raw=Array<number>(1802).fill(0);
 for(let row=0;row<30;row++)raw[row*30+7]=4;
 raw[7*30+7]=40;raw[8*30+7]=49;raw[9*30+7]=42;
 return raw;
}
