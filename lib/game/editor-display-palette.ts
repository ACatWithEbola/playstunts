import {editorPaletteDraw} from './editor-palette-draw.ts';
export interface OriginalEditorDisplayHost {unclippedBitmap(pointer:{offset:number;segment:number},position:{x:number;y:number},operation:'copy'|'and'|'or'):void;}
/** Original1DEFE..1E0DB terrain, mask and colour order with each driver's
 * unclipped raw bitmap routines. Functional masks remain original assets. */
export function drawOriginalEditorDisplayPalette(host:OriginalEditorDisplayHost,page:number,pages:number[][],objects:{multiTile:number}[],art:{small:string;large:string}[],terrainNames:string[],images:Record<string,{offset:number;segment:number}>){
 const operations:Record<string,'copy'|'and'|'or'>={'0x25b64':'copy','0x25852':'and','0x26046':'or'};
 for(const command of editorPaletteDraw(pages,page,objects)){
  const name=command.table==='terrain'?terrainNames[command.tile]:art[command.tile][command.table],image=images[name];if(!image)throw Error(`Missing original editor bitmap: ${name}`);
  host.unclippedBitmap(image,{x:command.x,y:command.y},operations[command.routine]);
 }
}
