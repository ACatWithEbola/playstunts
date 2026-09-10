/** Original-format course used for tunnel wall and roof comparisons. */
export function tunnelCircuit():number[]{
 const raw=Array<number>(1802).fill(0);
 for(let row=0;row<30;row++)raw[row*30+7]=4;
 for(const row of [7,8,9])raw[row*30+7]=66;
 return raw;
}
