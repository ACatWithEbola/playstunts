export interface EditorPlacementInput {page:number;cursor:number[];last:number[];selected:number;previous:number;change:number;refresh:number;redraw:number;revision:number;track:number[];terrain:number[]}
/** Original 0x1d96e..0x1dba2 placement branch, without subsequent UI work. */
export function editorPlacement(input:EditorPlacementInput,objects:{multiTile:number}[]){
 const {page,cursor}=input;let {selected,previous,change,refresh,redraw,revision}=input;
 let last=[...input.last];const track=[...input.track],terrain=[...input.terrain];
 const result=()=>({last,selected,previous,change,refresh,redraw,revision,track,terrain});
 if(page){const size=objects[selected].multiTile;if((size&1)&&cursor[1]>28||(size&2)&&cursor[0]>28)return result();}
 const index=page?(29-cursor[1])*30+cursor[0]:cursor[1]*30+cursor[0];
 if(cursor[0]===last[0]&&cursor[1]===last[1]){[selected,previous]=[previous,selected];change=(change+1)&255;}
 else{previous=(page?track:terrain)[index];if(page&&previous>=253)previous=0;last=[...cursor];}
 (page?track:terrain)[index]=selected;refresh=1;redraw=1;revision=(revision+1)&255;
 if(page){const size=objects[selected].multiTile;
  if(size===1||size===3)track[index-30]=254;
  if(size===2||size===3)track[index+1]=255;
  if(size===3)track[index-29]=253;
 }
 return result();
}
