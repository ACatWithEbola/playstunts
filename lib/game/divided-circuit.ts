/** Original-code comparison layout for the divided-road section. */
export function dividedCircuit():number[]{
 const raw=Array<number>(1802).fill(0);
 for(let row=0;row<30;row++)raw[row*30+7]=4;
 raw[8*30+7]=109;
 return raw;
}
