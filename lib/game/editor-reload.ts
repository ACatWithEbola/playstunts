import {loadEditorTrack,type EditorRouteResources} from './editor-load-track.ts';
import type {EditorActivationState} from './editor-activation-step.ts';
/** Apply the original post-load fields while preserving unrelated editor state. */
export function reloadEditorTrack(state:EditorActivationState,bytes:Uint8Array,resources:EditorRouteResources){
 return {...state,...loadEditorTrack(bytes,state.revision,resources)};
}
