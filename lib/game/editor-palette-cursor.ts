/** Original 0x1cd00..0x1ce2d, including action-row cursor adjustments. */
export function editorPaletteCursor(pages:number[][],page:number,cursor:number[],previousTile:number){
 let [column,row]=cursor;let x=220+column*16,y=36+row*16,width=16,height=16,tile=previousTile;
 if(row===6){x=220;width=96;height=8;}
 else if(row===7){y-=8;column=0;x=220;width=96;tile=0;}
 else if(row>7){y-=8;column=column<3?0:3;x=220+column*16;width=48;tile=0;}
 else{
  const index=row*6+column;
  if(row<5&&pages[page][index+6]===254)height=32;
  if(column<5&&pages[page][index+1]===255)width=32;
  tile=pages[page][index];if(tile>=253)tile=0;
 }
 if(page===0)tile=0;
 return {cursor:[column,row],x,y,width,height,tile};
}
