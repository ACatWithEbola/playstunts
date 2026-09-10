import {editorPlacement,type EditorPlacementInput} from './editor-placement.ts';
import {encodeTrackFile,type TrackFileBuffers} from './track-file.ts';

export type EditorEditState=Omit<EditorPlacementInput,'refresh'> & {modified:number};
/** Map the original BP-50 byte to the editor's modified state.
 * Keep both file metadata bytes while applying original placement semantics.
 */
export function placeEditorTrack(state:EditorEditState,objects:{multiTile:number}[]):EditorEditState{
 const {modified,...placement}=state;
 const {refresh,...result}=editorPlacement({...placement,refresh:modified},objects);
 return {...state,...result,modified:refresh};
}
/** Serialize current edits without clearing modified state before a successful save. */
export function serializeEditorTrack(state:TrackFileBuffers){return encodeTrackFile(state);}
