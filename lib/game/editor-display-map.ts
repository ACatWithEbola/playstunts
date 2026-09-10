import {editorMapDraw} from './editor-map-draw.ts';
import {editorMapClip} from './editor-map-render.ts';
import type {OriginalEditorDisplayHost} from './editor-display-palette.ts';
export interface OriginalEditorMapDisplayHost extends OriginalEditorDisplayHost {
 bitmap(pointer:{offset:number;segment:number},position:{x:number;y:number},format:'raw',operation:'copy'|'and'|'or'):void;
 bounds(left:number,right:number,top:number,bottom:number):void;
}
/** Original editor map caller clipping and 1E0DC drawing order. */
export function drawOriginalEditorDisplayMap(host:OriginalEditorMapDisplayHost,track:number[],terrain:number[],origin:number[],objects:{multiTile:number}[],art:{small:string;large:string}[],terrainNames:string[],images:Record<string,{offset:number;segment:number}>){
 const {left,right,top,bottom}=editorMapClip;host.bounds(left,right,top,bottom);
 const operations:Record<string,'copy'|'and'|'or'>={'0x25b64':'copy','0x25852':'and','0x26046':'or','0x259f0':'copy','0x256c4':'and','0x25eb8':'or'};
 for(const command of editorMapDraw(track,terrain,origin,objects)){
  const clipped=['0x259f0','0x256c4','0x25eb8'].includes(command.routine);
  if(clipped&&(((command.x<<16)>>16)>=right||((command.y<<16)>>16)>=bottom))continue;
  const name=command.table==='terrain'?terrainNames[command.tile]:art[command.tile][command.table],image=images[name];if(!image)throw Error(`Missing original editor bitmap: ${name}`);
  const position={x:command.x,y:command.y},operation=operations[command.routine];
  if(clipped)host.bitmap(image,position,'raw',operation);
  else host.unclippedBitmap(image,position,operation);
 }
}
