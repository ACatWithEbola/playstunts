const byte=(value:number)=>value<<24>>24;
/** Supplied C614..C741. Earlier lookahead slots belonging to this multi-tile
 * piece are suppressed. Signed-byte subtraction wraps, but the comparison
 * against offset+1 uses a signed word (127+1 does not wrap to -128).
 */
export function suppressOriginalMultiTile(lookahead:readonly (readonly number[])[],before:readonly number[],index:number,footprint:number,tile:readonly number[],camera:readonly number[]){
 if(lookahead.length!==23||before.length!==23||!Number.isInteger(index)||index<0||index>=23)throw Error('Invalid original lookahead state');
 const skip=[...before],x=byte(tile[0]-camera[0]),y=byte(tile[1]-camera[1]);
 for(let i=0;i<index;i++){
  const px=byte(lookahead[i][0]),py=byte(lookahead[i][1]);
  if(footprint===1?px===x&&(py===y||py===y+1):footprint===2?py===y&&(px===x||px===x+1):footprint===3?(px===x||px===x+1)&&(py===y||py===y+1):false)skip[i]=1;
 }
 return skip;
}
