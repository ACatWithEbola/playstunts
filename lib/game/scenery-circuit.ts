/** Test arrangement of the six original scenery collision types. */
export function sceneryCircuit():number[]{
 const raw=Array<number>(1802).fill(0);
 for(let row=0;row<30;row++)raw[row*30+7]=4;
 [155,175,163,159,167,171].forEach((id,index)=>{raw[8*30+4+index]=id;});
 return raw;
}
