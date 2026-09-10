import {editorCursorBlink} from './editor-cursor-blink.ts';
import {drawEditorRaster} from './editor-raster.ts';
import {drawEditorOutline} from './editor-outline.ts';
export interface EditorCursorImage {width:number;height:number;pixels:ArrayLike<number>}
/** Compose original blink branch with its verified drawing operations.
 * The caller captures the background and prepares the selected-piece image.
 */
export function renderEditorCursorBlink(target:Uint8Array,state:{ticks:number;phase:number;mode:number},selection:{x:number;y:number;width:number;height:number},cursor:EditorCursorImage,background:EditorCursorImage,outlineColor:number){
 const next=editorCursorBlink(state.ticks,state.mode,state.phase);
 if(next.action==='outline')drawEditorOutline(target,320,selection.x,selection.y-1,selection.x+selection.width,selection.y+selection.height-1,outlineColor);
 else if(next.action)drawEditorRaster(target,320,next.action==='restore'?background:cursor,selection.x,selection.y,'copy');
 return {...state,ticks:next.ticks,phase:next.phase};
}
