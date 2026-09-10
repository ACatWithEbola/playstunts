export interface RouteHistoryNode{column:number;row:number;record:number;direction:number}
/** Original0x12b02..0x12b3c and0x12ac2..0x12b01, after visited-cell gating. */
export function matchRouteHistory(nodes:RouteHistoryNode[],current:RouteHistoryNode,existingLinks:number[]){
 const links=existingLinks.slice();let direction=current.direction,closed=false;
 for(let i=0;i<nodes.length;i++){
  const n=nodes[i];if(n.column!==current.column||n.row!==current.row||n.record!==current.record)continue;
  if(n.direction!==direction)return {error:5,direction,closed,links};
  direction=-1;links[links[0]===-1?0:1]=i;if(i===0)closed=true;
 }
 return {error:0,direction,closed,links};
}
