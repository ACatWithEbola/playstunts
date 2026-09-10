/** Original palette-region branch 0x1d270..0x1d352; hit testing is external. */
export function editorPalettePointer(x:number,y:number,page:number,pages:number[][],before:{cursor:number[];mode:number;key:number}){
 let column=Math.trunc(((x-220)<<16>>16)/16)&255,row=Math.trunc(((y-36)<<16>>16)/16)&255;
 if(row<6){
  if(pages[page][row*6+column]===254)row--;
  if(pages[page][row*6+column]===255)column--;
 }else{
  row=Math.trunc(((y-28)<<16>>16)/16)&255;
  column=row===7||column<3?0:3;
 }
 let key=before.key&65535;
 if(before.mode===0||column!==before.cursor[0]||row!==before.cursor[1])key=1;
 if(key===32)key=13;
 return {cursor:[column,row],mode:1,key};
}
