// Original DS:2f3a/2f4e/2f62/2f76 edge-state tables for terrain IDs0..18.
const edges=[
 [0,0,0,0,0,0,1,2,1,3,0,2,3,0,0,1,1,3,2],
 [0,0,0,0,0,0,1,2,0,3,1,0,0,3,2,2,3,1,1],
 [0,0,0,0,0,0,1,1,5,0,4,5,0,0,4,1,5,4,1],
 [0,0,0,0,0,0,1,0,5,1,4,0,5,4,0,5,1,1,4],
];
/** Original 0x12529..0x12618; location uses terrain row order. */
export function validateTerrain(terrain:number[]):{error:number;location:number[]|null}{
 for(let axis=0;axis<2;axis++)for(let outer=0;outer<30;outer++){
  let state=99;
  for(let inner=0;inner<30;inner++){
   const column=axis?outer:inner,row=axis?inner:outer,tile=terrain[row*30+column];
   if(!Number.isInteger(tile)||tile<0||tile>18)throw Error('Terrain validation requires original terrain IDs0..18');
   if(state!==99&&edges[axis*2][tile]!==state)return {error:11,location:[column,row]};
   state=edges[axis*2+1][tile];
  }
 }
 return {error:0,location:null};
}
