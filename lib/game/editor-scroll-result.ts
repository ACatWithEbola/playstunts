/** Original post-scroll branches 0x1d08a/0x1d147. Widget selection is external. */
export function editorScrollResult(cursor:number[],origin:number[],axis:0|1,value:number){
 const nextCursor=[...cursor],nextOrigin=[...origin];
 nextCursor[axis]=(cursor[axis]+(value&255)-origin[axis])&255;nextOrigin[axis]=value&255;
 return {cursor:nextCursor,origin:nextOrigin,key:1};
}
