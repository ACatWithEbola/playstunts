/** Original 0x1d571..0x1d5d7 after palette lookup; coordinates use terrain rows. */
export function editorPieceSelection(cursor:number[],origin:number[],page:number,multiTile:number,dirty:number){
 let [column,row]=cursor;
 if(page){
  if((multiTile&1)&&row-origin[1]===10)row=(row-1)&255;
  if((multiTile&2)&&column-origin[0]===11)column=(column-1)&255;
 }
 return {cursor:[column,row],dirty:(dirty+1)&255,mode:0};
}
