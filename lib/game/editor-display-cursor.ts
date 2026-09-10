import {editorCursorBlink} from './editor-cursor-blink.ts';
import type {OriginalEditorDisplayHost} from './editor-display-palette.ts';
export interface OriginalEditorCursorDisplayHost extends OriginalEditorDisplayHost {xorRectangle(x:number,y:number,width:number,height:number,colour:number,clipped?:boolean):void;}
/** Original inclusive outline, excluding corners from the vertical strokes. */
export function drawOriginalEditorDisplayOutline(host:OriginalEditorCursorDisplayHost,left:number,top:number,right:number,bottom:number,colour:number){
 const s=(n:number)=>n<<16>>16,width=s(right-left+1),height=s(bottom-top-1);
 if(width>0){host.xorRectangle(left,top,width,1,colour);host.xorRectangle(left,bottom,width,1,colour);}
 if(height>0){host.xorRectangle(left,s(top+1),1,height,colour);host.xorRectangle(right,s(top+1),1,height,colour);}
}
/** Original1CF67..1CFF5. Caller owns captured background and cursor bitmap. */
export function drawOriginalEditorDisplayCursor(host:OriginalEditorCursorDisplayHost,state:{ticks:number;phase:number;mode:number},selection:{x:number;y:number;width:number;height:number},cursor:{offset:number;segment:number},background:{offset:number;segment:number},outlineColour:number){
 const next=editorCursorBlink(state.ticks,state.mode,state.phase);
 if(next.action==='outline')drawOriginalEditorDisplayOutline(host,selection.x,selection.y-1,selection.x+(selection.width<<24>>24),selection.y+(selection.height<<24>>24)-1,outlineColour);
 else if(next.action)host.unclippedBitmap(next.action==='restore'?background:cursor,{x:selection.x,y:selection.y},'copy');
 return {...state,ticks:next.ticks,phase:next.phase};
}
