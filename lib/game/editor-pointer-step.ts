import {dispatchEditorPointer} from './editor-pointer-dispatch.ts';
import {releaseEditorScrollControl,type EditorScrollState} from './editor-scroll-controls.ts';
import {editorInputTail} from './editor-input-tail.ts';
export interface EditorPointerState extends EditorScrollState {selection:number;lastColumn:number}
/** Process one pointer sample. Scrollbar interactions suspend the common input tail. */
export function stepEditorPointer(state:EditorPointerState,x:number,y:number,enabled:boolean,buttons:number,selectedMultiTile:number,pages:number[][]){
 const result=dispatchEditorPointer(state,x,y,enabled,buttons,selectedMultiTile,pages);
 const next={...state,...result.state};
 if(result.scroll!==null)return {state:next,pending:{region:result.scroll,initial:[x,y]}};
 return {state:{...next,...editorInputTail(next.key,next.selection,next.lastColumn)},pending:null};
}
/** Resume the original caller only after a held scrollbar operation returns. */
export function finishEditorPointerScroll(state:EditorPointerState,pending:{region:0|1|2;initial:number[]},release:number[]){
 const next={...state,...releaseEditorScrollControl(state,pending.region,pending.initial,release)};
 return {...next,...editorInputTail(next.key,next.selection,next.lastColumn)};
}
