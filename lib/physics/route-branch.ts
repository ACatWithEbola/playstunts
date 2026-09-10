export interface RouteBranch{
 column:number;row:number;tile:number;record:number;direction:number;run:number;
 previousColumn:number;previousRow:number;previousTile:number;previousRecord:number;previousDirection:number;state:number;previousNode:number;
}
/** Original14-byte pending branch record at0x12b94..0x12c22. */
export function encodeRouteBranch(b:RouteBranch):number[]{
 return [b.column,b.row,b.tile,b.record,b.direction,b.run,b.previousColumn,b.previousRow,b.previousTile,b.previousRecord,b.previousDirection,b.state,b.previousNode,b.previousNode>>8].map(v=>v&255);
}
/** Original branch stack is LIFO and reports error8 at64 entries. */
export function pushRouteBranch(stack:number[][],branch:RouteBranch):number{
 if(stack.length===64)return 8;
 stack.push(encodeRouteBranch(branch));return 0;
}
/** Original0x1280a..0x12898 restores the most recently saved branch. */
export function popRouteBranch(stack:number[][]):RouteBranch|null{
 const r=stack.pop();if(!r)return null;
 const [column,row,tile,record,direction,run,previousColumn,previousRow,previousTile,previousRecord,previousDirection,state]=r;
 const previousNode=((r[12]|(r[13]<<8))<<16)>>16;
 return {column,row,tile,record,direction,run,previousColumn,previousRow,previousTile,previousRecord,previousDirection,state,previousNode};
}
