import {originalMainMenuBounds} from './main-menu-hit.ts';
export interface OriginalMainMenuDisplayHost {rectangle(x:number,y:number,width:number,height:number,colour:number,clipped?:boolean):void;}
/** Original main-menu flash arguments at DS4E8E/4E90 are driver-native
 * repeated pixel patterns, retaining their full words for the raster driver. */
export function originalMainMenuDisplayColours(memory:Uint8Array,d:number){const word=(at:number)=>memory[d+at]|(memory[d+at+1]<<8);return {late:word(0x4e8e),early:word(0x4e90)};}
export function drawOriginalMainMenuDisplaySelection(host:OriginalMainMenuDisplayHost,selected:number,colour:number){
 const [left,top,right,bottom]=originalMainMenuBounds[selected];
 host.rectangle(left,top,right-left+1,1,colour);host.rectangle(left,bottom,right-left+1,1,colour);host.rectangle(left,top,1,bottom-top,colour);host.rectangle(right,top,1,bottom-top,colour);
}
