import {analyzeRoute} from '../physics/route-analysis.ts';
import {decodeTrackFile} from './track-file.ts';
import {editorLoadedState} from './editor-loaded-state.ts';

export interface EditorRouteResources {
 records:Parameters<typeof analyzeRoute>[1];
 metadataVectors:Parameters<typeof analyzeRoute>[2];
 sampleVectors:Parameters<typeof analyzeRoute>[3];
 objects:Parameters<typeof analyzeRoute>[4];
}
/** Compose file decoding, original route analysis, and the editor's post-load branch.
 * Validation errors describe an editable track; they do not reject the load.
 * File selection, unsaved-change prompts, and filename handling belong to the caller.
 */
export function loadEditorTrack(bytes:Uint8Array,revision:number,resources:EditorRouteResources){
 const buffers=decodeTrackFile(bytes);
 const analysis=analyzeRoute(Array.from(bytes),resources.records,resources.metadataVectors,resources.sampleVectors,resources.objects,undefined,{sample:false});
 if(!analysis.location)throw Error('Track analysis did not report an editor location');
 return {...buffers,...editorLoadedState(analysis.location,revision),analysis};
}
