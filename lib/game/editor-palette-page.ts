/** Original page-change resolution 0x1c9b1..0x1c9de, before drawing. */
export function resolveEditorPalettePage(pages:number[][],page:number,cursor:number[]){
 let [column,row]=cursor;
 for(let guard=0;guard<36;guard++){
  const tile=pages[page]?.[row*6+column];
  if(tile===undefined)throw Error('Palette cursor requires original caller memory outside page');
  if(tile<254)return [column,row];
  if(tile===255)column--;else row--;
 }
 throw Error('Palette marker resolution exceeded diagnostic bound');
}
