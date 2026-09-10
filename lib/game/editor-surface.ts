import {renderEditorMap} from './editor-map-render.ts';
import {renderEditorPalette} from './editor-palette-render.ts';
import {editorMapCursor} from './editor-map-cursor.ts';
import {editorPaletteCursor} from './editor-palette-cursor.ts';
import {editorPieceCursorArt} from './editor-piece-cursor-art.ts';
import {editorTerrainCursorArt} from './editor-terrain-cursor-art.ts';
import {captureEditorRaster} from './editor-capture-raster.ts';
import {renderEditorCursorBlink,type EditorCursorImage} from './editor-cursor-render.ts';
import {drawEditorRaster} from './editor-raster.ts';
import {drawEditorOutline} from './editor-outline.ts';

export interface EditorSurfaceResources {
 pages:number[][];objects:{multiTile:number}[];art:{small:string;large:string}[];
 terrainNames:string[];images:Record<string,EditorCursorImage>;
}
export interface EditorSurfaceState {
 track:number[];terrain:number[];origin:number[];cursor:number[];paletteCursor:number[];
 page:number;mode:number;selected:number;shape:number;size:number[];previousTile:number;
}
/** Drawing composition only. Background chrome and original color values are supplied by the caller. */
export function prepareEditorSurface(base:Uint8Array,state:EditorSurfaceState,resources:EditorSurfaceResources,colors:{terrainBorder:number;outline:number}){
 const {pages,objects,art,terrainNames,images}=resources,pixels=base.slice();
 renderEditorMap(pixels,state.track,state.terrain,state.origin,objects,art,terrainNames,images);
 renderEditorPalette(pixels,state.page,pages,objects,art,terrainNames,images);
 const selection=state.mode?editorPaletteCursor(pages,state.page,state.paletteCursor,state.previousTile):editorMapCursor(state.track,state.cursor,state.origin,state.size);
 const cursor=state.page?editorPieceCursorArt(state.selected,state.shape,art,images):editorTerrainCursorArt(state.selected,colors.terrainBorder,terrainNames,images);
 const background=state.mode?{width:0,height:0,pixels:new Uint8Array()}:captureEditorRaster(pixels,320,cursor.width,cursor.height,selection.x,selection.y);
 return {pixels,selection,cursor,background,outlineColor:colors.outline,blink:{ticks:99,phase:0,mode:state.mode}};
}
export type EditorSurface=ReturnType<typeof prepareEditorSurface>;
export function blinkEditorSurface(surface:EditorSurface){
 surface.blink=renderEditorCursorBlink(surface.pixels,surface.blink,surface.selection,surface.cursor,surface.background,surface.outlineColor);
}
/** Remove a visible cursor before a caller redraws or changes selection. */
export function clearEditorSurfaceCursor(surface:EditorSurface){
 if(!(surface.blink.phase&1))return;
 const {selection}=surface;
 if(surface.blink.mode)drawEditorOutline(surface.pixels,320,selection.x,selection.y-1,selection.x+selection.width,selection.y+selection.height-1,surface.outlineColor);
 else drawEditorRaster(surface.pixels,320,surface.background,selection.x,selection.y,'copy');
 surface.blink.phase^=1;
}
