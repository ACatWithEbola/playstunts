import {drawOriginalEditorChrome,drawOriginalEditorScrollbar} from './editor-chrome.ts';
import {drawOriginalEditorLabel} from './editor-label.ts';
import {prepareEditorSurface,type EditorSurfaceState,type EditorSurfaceResources} from './editor-surface.ts';
export interface EditorScreenResources extends EditorSurfaceResources {font:Uint8Array;text:Record<string,ReadonlyArray<number>>;labelKeys:string[]}
/** Compose the original black backing sprite, chrome, map, palette, scrollbar
 * indicators and current piece label. Cursor presentation remains timed. */
export function prepareOriginalEditorScreen(state:EditorSurfaceState,resources:EditorScreenResources){
 const base=new Uint8Array(65536);drawOriginalEditorChrome(base,resources.font,resources.text);
 drawOriginalEditorScrollbar(base,9,181,192,5,state.origin[0],12,30,15);
 drawOriginalEditorScrollbar(base,202,4,5,176,state.origin[1],11,30,15);
 drawOriginalEditorScrollbar(base,221,133,95,5,state.page?state.page-1:0,1,state.page?10:1,15);
 const surface=prepareEditorSurface(base,state,resources,{terrainBorder:1,outline:12});
 drawOriginalEditorLabel(surface.pixels,resources.font,resources.text[resources.labelKeys[surface.selection.tile]],0,15);
 return surface;
}
