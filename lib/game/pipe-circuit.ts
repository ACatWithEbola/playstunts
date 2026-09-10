/** Original-format entrance, main pipe, and exit used in the continuous oracle. */
export function pipeCircuit():number[]{
 const raw=Array<number>(1802).fill(0);
 for(let row=0;row<30;row++)raw[row*30+7]=4;
 raw[7*30+7]=70;
 raw[8*30+7]=68;
 raw[9*30+7]=71;
 return raw;
}
