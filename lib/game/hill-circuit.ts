/** Ascending slope, raised ground and descending slope used by the original-code oracle. */
export function hillCircuit():number[]{
 const raw=Array<number>(1802).fill(0);
 for(let row=0;row<30;row++){
  raw[row*30+7]=4;
  const terrain=row===8?7:row===9?6:row===10?9:0;
  for(let column=0;column<30;column++)raw[901+(29-row)*30+column]=terrain;
 }
 return raw;
}
