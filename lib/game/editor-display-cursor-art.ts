import type {OriginalEditorDisplayHost} from './editor-display-palette.ts';
export interface OriginalEditorCursorArtDisplayHost extends OriginalEditorDisplayHost {line(x0:number,y0:number,x1:number,y1:number,colour:number):unknown;}
/** Original1CB24..1CC11; caller selects the allocated cursor window first. */
export function drawOriginalEditorDisplayCursorArt(host:OriginalEditorCursorArtDisplayHost,page:number,tile:number,shape:number,colour:number,art:{small:string;large:string}[],terrainNames:string[],images:Record<string,{offset:number;segment:number}>){
 const draw=(name:string,operation:'copy'|'and'|'or')=>{const image=images[name];if(!image)throw Error(`Missing original editor cursor bitmap: ${name}`);host.unclippedBitmap(image,{x:0,y:0},operation);};
 if(page===0){draw(terrainNames[tile],'copy');host.line(1,0,15,0,colour);host.line(1,14,15,14,colour);host.line(1,0,1,14,colour);host.line(15,0,15,14,colour);}
 else{draw('crs'+shape,'copy');if(tile!==0){draw(art[tile].large,'and');draw(art[tile].small,'or');}}
}
