/** Original 0x1c87b..0x1c98b when selection/page changes trigger size refresh. */
export function editorViewport(cursor:number[],origin:number[],last:number[],page:number,mode:number,multiTile:number,revision=0,refresh=0){
 let [column,row]=cursor,[x,y]=origin;let width=1,height=1,shape=0;
 if(page&&multiTile>=1&&multiTile<=3){shape=multiTile;width=multiTile&2?2:1;height=multiTile&1?2:1;}
 let previous=[...last];
 if(!mode){
  if(column===29&&width===2)column--;
  if(row===29&&height===2)row--;
  x=Math.min(column,Math.max(x,column+width-12));
  y=Math.min(row,Math.max(y,row+height-11));
  if(x!==last[0]||y!==last[1]){previous=[x,y];revision=1;refresh=1;}
 }
 return {cursor:[column,row],origin:[x,y],last:previous,size:[width,height],shape,revision,refresh};
}
