import {drawOriginalFont} from './font-raster.ts';
/** Original1b342: four diagonal outline copies, then the foreground. */
export function drawOriginalOutlinedFont(target:Uint8Array,font:Uint8Array,text:string,x:number,y:number,color:number,outline:number,rowOffsets:ReadonlyArray<number>){
 for(const [dx,dy] of [[1,1],[-1,1],[1,-1],[-1,-1]])drawOriginalFont(target,font,text,x+dx,y+dy,outline,rowOffsets);
 return drawOriginalFont(target,font,text,x,y,color,rowOffsets);
}
