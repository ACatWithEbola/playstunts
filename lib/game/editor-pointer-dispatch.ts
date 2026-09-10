import {editorHitRegion} from './editor-hit-region.ts';
import {editorMapPointer} from './editor-map-pointer.ts';
import {editorPalettePointer} from './editor-palette-pointer.ts';
import type {EditorScrollState} from './editor-scroll-controls.ts';
/** Original region dispatch before the common key-processing tail.
 * A scrollbar request remains pending until its held interaction finishes.
 */
export function dispatchEditorPointer(state:EditorScrollState,x:number,y:number,enabled:boolean,buttons:number,selectedMultiTile:number,pages:number[][]){
 const region=editorHitRegion(x,y,enabled);let next={...state};let scroll:0|1|2|null=null;
 if(region===3)next={...next,...editorMapPointer(x,y,state.page,selectedMultiTile,state)};
 else if(region===4){const result=editorPalettePointer(x,y,state.page,pages,{cursor:state.paletteCursor,mode:state.mode,key:state.key});next={...next,paletteCursor:result.cursor,mode:result.mode,key:result.key};}
 else if(region===0||region===1){if(buttons&3){next.mode=0;scroll=region;}}
 else if(region===2){
  if(state.mode!==1||state.paletteCursor[1]!==6)next={...next,mode:1,paletteCursor:[state.paletteCursor[0],6],key:1};
  if(buttons&3)scroll=2;
 }
 return {state:next,scroll};
}
