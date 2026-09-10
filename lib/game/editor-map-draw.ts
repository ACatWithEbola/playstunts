import type {EditorPaletteDraw} from './editor-palette-draw.ts';
/** Original map drawing-call schedule 0x1e0dc..0x1e7df. Coordinates are 16-bit words. */
export function editorMapDraw(track:number[],terrain:number[],origin:number[],objects:{multiTile:number}[]):EditorPaletteDraw[]{
 const commands:EditorPaletteDraw[]=[];
 const tileAt=(column:number,row:number)=>track[(29-row)*30+column];
 const draw=(routine:string,table:EditorPaletteDraw['table'],tile:number,x:number,y:number)=>commands.push({routine,table,tile,x:x&65535,y:y&65535});
 const background=(column:number,row:number,x:number,y:number,clipped:boolean)=>draw(clipped?'0x259f0':'0x25b64','terrain',terrain[row*30+column],x,y);
 const piece=(tile:number,x:number,y:number,clipped:boolean)=>{
  draw(clipped?'0x256c4':'0x25852','large',tile,x,y);
  draw(clipped?'0x25eb8':'0x26046','small',tile,x,y);
 };
 for(let row=0;row<11;row++)for(let column=0;column<12;column++){
  const c=origin[0]+column,r=origin[1]+row,x=8+column*16,y=4+row*16,tile=tileAt(c,r);
  if(tile>=253&&(row===0||column===0)){
   if(tile===255&&column===0){
    background(c,r,x,y,true);background(c,r+1,x,y+16,true);piece(tileAt(c-1,r),x-16,y,true);
   }else if(tile===254&&row===0){
    background(c,r,x,y,true);background(c+1,r,x+16,y,true);piece(tileAt(c,r-1),x,y-16,true);
   }else if(tile===253&&row===0&&column===0){
    background(c,r,x,y,true);piece(tileAt(c-1,r-1),x-16,y-16,true);
   }
   continue;
  }
  if(tile>=253)continue;
  background(c,r,x,y,false);
  if(tile===0)continue;
  const size=objects[tile].multiTile;
  if(size===0){piece(tile,x,y,false);continue;}
  if(size===2||size===3)background(c+1,r,x+16,y,true);
  if(size===1||size===3)background(c,r+1,x,y+16,true);
  if(size===3)background(c+1,r+1,x+16,y+16,true);
  if(size>=1&&size<=3)piece(tile,x,y,true);
 }
 return commands;
}
