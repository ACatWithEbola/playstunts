import type {prepareNativeDisplayEditorResources} from './native-display-editor-resources.ts';
import type {NativeEditorPresentation} from './native-editor-runtime.ts';
import {prepareOriginalEditorDisplayScreen,blinkOriginalEditorDisplaySurface,clearOriginalEditorDisplaySurfaceCursor} from './editor-display-screen.ts';
export function createNativeDisplayEditorPresentation(display:Awaited<ReturnType<typeof prepareNativeDisplayEditorResources>>,dialogs:NativeEditorPresentation['dialogs'],present:()=>void):NativeEditorPresentation{
 const {owner,resources}=display,{d,mode,drawing}=owner;
 return {dialogs,prepare(state){const surface=prepareOriginalEditorDisplayScreen(owner.memory(),d,mode,drawing,state,resources);return {selection:surface.selection,get blink(){return surface.blink;},show:present,blinkCursor(){blinkOriginalEditorDisplaySurface(drawing,surface);},clearCursor(){clearOriginalEditorDisplaySurfaceCursor(drawing,surface);}};},scrollbar(x,y,width,height,start,size){drawing.rectangle(x,y,width,height,0,false);const m=owner.memory(),colour=m[d+0x4e8a]|m[d+0x4e8b]<<8;if(width<=height)drawing.rectangle(x,y+start,width,size,colour,false);else drawing.rectangle(x+start,y,size,height,colour,false);}};
}
