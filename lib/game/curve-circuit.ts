/** Original-format curved-bank course from the 400-step comparison. */
export function curveCircuit():number[]{
 const raw=Array<number>(1802).fill(0);
 for(let row=0;row<30;row++)raw[row*30+7]=4;
 raw[7*30+7]=40;raw[9*30+6]=53;
 raw[8*30+6]=254;raw[8*30+7]=253;raw[9*30+7]=255;
 return raw;
}
