import {drawOriginalEditorDisplayChrome,drawOriginalEditorDisplayScrollbar} from './editor-display-chrome.ts';
import {drawOriginalEditorDisplayMap,type OriginalEditorMapDisplayHost} from './editor-display-map.ts';
import {drawOriginalEditorDisplayPalette} from './editor-display-palette.ts';
import {drawOriginalEditorDisplayCursorArt,type OriginalEditorCursorArtDisplayHost} from './editor-display-cursor-art.ts';
import {drawOriginalEditorDisplayLabel} from './editor-display-label.ts';
import {drawOriginalEditorDisplayCursor,drawOriginalEditorDisplayOutline,type OriginalEditorCursorDisplayHost} from './editor-display-cursor.ts';
import {editorMapCursor} from './editor-map-cursor.ts';
import {editorPaletteCursor} from './editor-palette-cursor.ts';
import type {EditorSurfaceState} from './editor-surface.ts';
import type {OriginalMenuButtonDisplayHost} from './menu-button-display.ts';
type Pointer={offset:number;segment:number};
export interface OriginalEditorScreenDisplayHost extends OriginalEditorMapDisplayHost,OriginalEditorCursorArtDisplayHost,OriginalEditorCursorDisplayHost,OriginalMenuButtonDisplayHost {
 selectWindow(pointer:Pointer):void;capture(pointer:Pointer,position:{x:number;y:number}):void;clearWindow(colour:number):void;
}
export interface OriginalEditorDisplayScreenResources {
 pages:number[][];objects:{multiTile:number}[];art:{small:string;large:string;labelResource:string}[];terrainNames:string[];images:Record<string,Pointer>;text:Record<string,readonly number[]>;
 screenWindow:Pointer;cursorWindows:Pointer[];cursorBitmaps:Pointer[];backgrounds:Pointer[];textScratch:number;
}
/** Native alternative editor composition; original allocator/window ownership
 * stays with the caller, so no emulator or fixture memory enters the game. */
export function prepareOriginalEditorDisplayScreen(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:OriginalEditorScreenDisplayHost,state:EditorSurfaceState,r:OriginalEditorDisplayScreenResources){
 const word=(at:number)=>memory[d+at]|memory[d+at+1]<<8;
 host.selectWindow(r.screenWindow);host.bounds(0,320,0,200);host.clearWindow(0);drawOriginalEditorDisplayChrome(memory,d,host,r.text,r.textScratch);
 drawOriginalEditorDisplayMap(host,state.track,state.terrain,state.origin,r.objects,r.art,r.terrainNames,r.images);host.bounds(0,320,0,200);
 drawOriginalEditorDisplayPalette(host,state.page,r.pages,r.objects,r.art,r.terrainNames,r.images);
 drawOriginalEditorDisplayScrollbar(host,9,181,192,5,state.origin[0],12,30,word(0x4e8a));drawOriginalEditorDisplayScrollbar(host,202,4,5,176,state.origin[1],11,30,word(0x4e8a));drawOriginalEditorDisplayScrollbar(host,221,133,95,5,state.page?state.page-1:0,1,state.page?10:1,word(0x4e8a));
 const selection=state.mode?editorPaletteCursor(r.pages,state.page,state.paletteCursor,state.previousTile):editorMapCursor(state.track,state.cursor,state.origin,state.size);
 host.selectWindow(r.cursorWindows[state.shape]);drawOriginalEditorDisplayCursorArt(host,state.page,state.selected,state.shape,word(0x4ec0),r.art,r.terrainNames,r.images);host.selectWindow(r.screenWindow);host.bounds(0,320,0,200);
 drawOriginalEditorDisplayLabel(memory,d,mode,host,r.text[r.art[selection.tile].labelResource],0,word(0x4e8a),r.textScratch);
 const cursor=r.cursorBitmaps[state.shape],background=r.backgrounds[state.shape];if(!state.mode)host.capture(background,selection);
 return {selection,cursor,background,outlineColour:word(0x4eb2),blink:{ticks:99,phase:0,mode:state.mode}};
}
export type OriginalEditorDisplaySurface=ReturnType<typeof prepareOriginalEditorDisplayScreen>;
export function blinkOriginalEditorDisplaySurface(host:OriginalEditorCursorDisplayHost,surface:OriginalEditorDisplaySurface){surface.blink=drawOriginalEditorDisplayCursor(host,surface.blink,surface.selection,surface.cursor,surface.background,surface.outlineColour);}
export function clearOriginalEditorDisplaySurfaceCursor(host:OriginalEditorCursorDisplayHost,surface:OriginalEditorDisplaySurface){
 if(!(surface.blink.phase&1))return;const s=surface.selection;
 if(surface.blink.mode)drawOriginalEditorDisplayOutline(host,s.x,s.y-1,s.x+s.width,s.y+s.height-1,surface.outlineColour);else host.unclippedBitmap(surface.background,{x:s.x,y:s.y},'copy');surface.blink.phase^=1;
}
