/** Supplied C79B..C803: choose the latest eligible lookahead slot occupied by
 * a transformed car corner. Suppressed multi-tile slots (skip=1) still qualify.
 */
export function selectOriginalCarCornerTile(lookahead:readonly (readonly number[])[],skip:readonly number[],camera:readonly number[],corner:readonly number[],cornerIndex:number,before:{index:number;corner:number;column:number;row:number}){
 const signed=(n:number)=>n<<24>>24;
 if(lookahead.length!==23||skip.length!==23)throw Error('Original car tile selection requires 23 slots');
 const result={...before};
 for(let i=22;i>before.index;i--){
  if(skip[i]===2)continue;
  if(signed(camera[0])+signed(lookahead[i][0])!==signed(corner[0])||signed(camera[1])+signed(lookahead[i][1])!==signed(corner[1]))continue;
  result.index=i;result.corner=cornerIndex;result.column=corner[0]&255;result.row=corner[1]&255;break;
 }
 return result;
}
