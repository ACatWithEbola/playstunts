export interface EditorPaletteDraw {routine:string;table:'terrain'|'large'|'small';tile:number;x:number;y:number}
/** Original 0x1defe..0x1e0db drawing-call order. Raster operations remain external. */
export function editorPaletteDraw(pages:number[][],page:number,objects:{multiTile:number}[]):EditorPaletteDraw[]{
 const commands:EditorPaletteDraw[]=[];
 const background=(tile:number,x:number,y:number)=>commands.push({routine:'0x25b64',table:'terrain',tile,x,y});
 for(let row=0;row<6;row++)for(let column=0;column<6;column++){
  const tile=pages[page][row*6+column],x=220+column*16,y=36+row*16;
  if(page===0){background(tile,x,y);continue;}
  if(tile>=253)continue;
  background(0,x,y);
  const size=objects[tile].multiTile;
  if(size===2||size===3)background(0,x+16,y);
  if(size===1||size===3)background(0,x,y+16);
  if(size===3)background(0,x+16,y+16);
  commands.push({routine:'0x25852',table:'large',tile,x,y});
  commands.push({routine:'0x26046',table:'small',tile,x,y});
 }
 return commands;
}
