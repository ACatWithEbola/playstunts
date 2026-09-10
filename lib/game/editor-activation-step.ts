import {editorActivate} from './editor-activate.ts';
import {selectEditorPiece} from './editor-select-piece.ts';
import {placeEditorTrack,type EditorEditState} from './editor-edit-track.ts';
import {cycleEditorPage} from './editor-page-cycle.ts';
export type EditorActivationState=EditorEditState & {mode:number;origin:number[];paletteCursor:number[]};
/** Connect original Enter routing to synchronous actions; dialogs remain explicit requests. */
export function stepEditorActivation(state:EditorActivationState,pages:number[][],objects:{multiTile:number}[]){
 const action=editorActivate(state.mode,state.paletteCursor,state.redraw);
 let next={...state,redraw:action.redraw};
 if(action.command==='place')next={...next,...placeEditorTrack(next,objects)};
 else if(action.command==='select'){
  const {dirty,...selection}=selectEditorPiece(pages,objects,state.page,state.paletteCursor,state.cursor,state.origin,state.change);
  next={...next,...selection,change:dirty};
 }else if(action.command==='page')next={...next,...cycleEditorPage(state.page)};
 else return {state:next,request:action.command};
 return {state:next,request:null};
}
