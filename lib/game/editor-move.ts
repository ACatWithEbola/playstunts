export type EditorDirection='up'|'down'|'left'|'right';
/** Supplied 1dbe0..1de4b. Marker comparisons sign-extend the byte before
 * comparing it with positive 254/255. The resulting original infinite loops
 * are reported as stalled, allowing a host to stop editor progression without
 * blocking the browser's event loop. */
export function moveOriginalEditorCursor(mode:number,direction:EditorDirection,page:number,cursor:number[],lastColumn:number,pages:number[][]){
 let [x,y]=cursor,stalled=false;
 const result=()=>({page,cursor:[x,y],lastColumn,stalled});
 const tile=(dx=0)=>pages[page]?.[y*6+x+dx];
 if(mode&&y===6&&(direction==='left'||direction==='right')){if(direction==='left'){if(page>1)page--;}else if(page<10)page++;return result();}
 if(direction==='up'){
  if(!y)return result();lastColumn=255;y--;
  if(mode&&y<6&&tile()>=254)stalled=true;
 }else if(direction==='down'){
  if(y>=(mode?9:29))return result();lastColumn=255;y++;
  // In this branch the impossible signed marker comparisons fall through.
 }else if(direction==='left'){
  if(!x)return result();lastColumn=255;x--;
  if(mode){if(y>5)x=0;else if(tile()>=254)stalled=true;}
 }else{
  const step=mode&&y>5?3:1,limit=mode?6:30;
  if(mode&&y<=5&&x+step<limit&&tile(step)>=254){stalled=true;return result();}
  if(x+step<limit){x+=step;lastColumn=255;}
 }
 return result();
}
