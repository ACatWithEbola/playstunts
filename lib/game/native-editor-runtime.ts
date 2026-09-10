import type {EditorSurfaceState,EditorSurface} from './editor-surface.ts';
import {editorScrollbarDrag} from './editor-scrollbar-drag.ts';
import {editorScrollControls} from './editor-scroll-controls.ts';
import {drawOriginalEditorScrollbarThumb} from './editor-chrome.ts';
import {editorInitialState} from './editor-initial-state.ts';
import {loadEditorTrack} from './editor-load-track.ts';
import {prepareOriginalEditorScreen,type EditorScreenResources} from './editor-screen.ts';
import {blinkEditorSurface,clearEditorSurfaceCursor} from './editor-surface.ts';
import {editorViewport} from './editor-viewport.ts';
import {resolveEditorPalettePage} from './editor-palette-page.ts';
import {cleanOriginalEditorTrack} from './editor-track-cleanup.ts';
import {stepEditorPointer,finishEditorPointerScroll} from './editor-pointer-step.ts';
import {dispatchEditorKey} from './editor-key-dispatch.ts';
import {moveOriginalEditorCursor,type EditorDirection} from './editor-move.ts';
import {editorHome} from './editor-home.ts';
import {stepEditorActivation,type EditorActivationState} from './editor-activation-step.ts';
import {runNativeEditorAction,type NativeEditorActionHost,type NativeEditorActionState} from './native-editor-actions.ts';
import {createNativeDialogRuntime} from './native-dialog-runtime.ts';
import {analyzeRoute} from '../physics/route-analysis.ts';
import {applyEditorValidationResult} from './editor-validation-result.ts';
import {advanceEditorRouteSelection} from './editor-route-selection.ts';
import {encodeTrackFile} from './track-file.ts';
export interface NativeEditorHost extends NativeEditorActionHost {
 screenResources:EditorScreenResources;errorKeys:string[];
 /** Retained source word adjacent to the track row table. */
 // Legacy host field name: this is the retained word after the row table,
 // not the current mouse-button sample.
 retainedMouseButtons?():number;
 mainFrameBP?:number;
 track:{name:string;path:string;raw:number[]};counter():number;
 /** Wait without consuming the keyboard/pointer input queue. */
 waitTicks(ticks:number):Promise<void>;
}
export interface NativeEditorPresentation {
 dialogs:ReturnType<typeof createNativeDialogRuntime>;
 prepare(state:EditorSurfaceState):{selection:EditorSurface['selection'];blink:EditorSurface['blink'];show():void;blinkCursor():void;clearCursor():void};
 scrollbar(x:number,y:number,width:number,height:number,start:number,size:number):void;
}
type State=NativeEditorActionState&EditorActivationState&{key:number;selection:number;lastColumn:number;savedPiece:number;previousTile:number;shape:number;size:number[]};
/** Native editor controller, assembled from the supplied editor branches.
 * The host owns storage and device timing; no DOS execution is used here. */
export async function runNativeEditor(host:NativeEditorHost,display?:NativeEditorPresentation){
 const r=host.screenResources,loaded=loadEditorTrack(Uint8Array.from(host.track.raw),0,host.routeResources),dialogs=display?.dialogs??createNativeDialogRuntime(host);
 let state:State={...loaded,...editorInitialState(loaded.cursor),name:host.track.name,path:host.track.path,modified:0,last:[255,0],previous:0,key:0,savedPiece:0,previousTile:0,shape:0,size:[1,1]};
 let previousPage=-1,previousOrigin=[255,255],routeColumns:number[]=[],routeRows:number[]=[];
 const commit=()=>{host.track.name=state.name;host.track.path=state.path;host.track.raw=Array.from(encodeTrackFile(state));};
 for(;;){
  const view=editorViewport(state.cursor,state.origin,previousOrigin,state.page,state.mode,r.objects[state.selected].multiTile,state.revision,state.redraw);previousOrigin=view.last;
  state={...state,cursor:view.cursor,origin:view.origin,shape:view.shape,size:view.size};
  if(previousPage!==state.page){state.paletteCursor=resolveEditorPalettePage(r.pages,state.page,state.paletteCursor);previousPage=state.page;}
  let cleanupError=0;
  if(state.redraw){const clean=cleanOriginalEditorTrack(state.track,state.terrain,r.objects,host.retainedMouseButtons?.(),host.mainFrameBP);state.track=clean.track;cleanupError=clean.error;state.redraw=0;}
  const surface=display?display.prepare(state):(()=>{const original=prepareOriginalEditorScreen(state,r);return {selection:original.selection,get blink(){return original.blink;},show(){host.pixels.set(original.pixels);host.present();},blinkCursor(){blinkEditorSurface(original);},clearCursor(){clearEditorSurfaceCursor(original);host.pixels.set(original.pixels);}};})();state.previousTile=surface.selection.tile;
  if('cursor' in surface.selection&&Array.isArray(surface.selection.cursor))state.paletteCursor=surface.selection.cursor;
  surface.show();
  if(cleanupError)await dialogs.dialog(host.errorKeys[cleanupError],1,0,1);
  let lastTime=host.counter();
  for(;;){
   surface.blinkCursor();surface.show();
   const input=await host.input(),now=host.counter();surface.blink.ticks=(surface.blink.ticks+((now-lastTime)&65535))&65535;lastTime=now;
   state.key=input.key;state.lastColumn=state.last[0];
   const pointer=stepEditorPointer(state,input.x,input.y,input.mouseActive,input.buttons,r.objects[state.selected].multiTile,r.pages);state={...state,...pointer.state};
   if(pointer.pending){
    const control=editorScrollControls[pointer.pending.region],axis=control.vertical?1:0,offset=control.vertical?control.y:control.x,value=pointer.pending.region===2?state.page-1:state.origin[pointer.pending.region];
    let release=input,lastStart=editorScrollbarDrag(control.width,control.height,value,control.visible,control.total,0,0).start;
    do{
     release=await host.input();
     const drag=editorScrollbarDrag(control.width,control.height,value,control.visible,control.total,pointer.pending.initial[axis]-offset,(axis?release.y:release.x)-offset);
     if(drag.dragging&&drag.start!==lastStart){lastStart=drag.start;if(display)display.scrollbar(control.x,control.y,control.width,control.height,drag.start,drag.size);else drawOriginalEditorScrollbarThumb(host.pixels,control.x,control.y,control.width,control.height,drag.start,drag.size,15);host.present();}
    }while(release.buttons&3);
    state={...state,...finishEditorPointerScroll(state,pointer.pending,[release.x,release.y])};
   }
   state.last[0]=state.lastColumn;
   if(!state.key)continue;
   if(state.selection)await host.waitTicks(10);
   surface.clearCursor();
   if(state.selection){state={...state,...advanceEditorRouteSelection(state,routeColumns,routeRows,state.track)};break;}
   const key=dispatchEditorKey(state.page,state.mode,state.key,state.selected);state={...state,...key};
   if(key.command==='home'&&!state.mode)state={...state,...editorHome(state.cursor,state.origin)};
   else if(['up','down','left','right'].includes(key.command??'')){
    const movement=moveOriginalEditorCursor(state.mode,key.command as EditorDirection,state.page,state.mode?state.paletteCursor:state.cursor,state.last[0],r.pages);
    state.page=movement.page;state.last[0]=movement.lastColumn;if(state.mode)state.paletteCursor=movement.cursor;else state.cursor=movement.cursor;
    if(movement.stalled){commit();for(;;)await host.waitTicks(10);}
   }else if(key.command==='activate'){
    const result=stepEditorActivation(state,r.pages,r.objects);state={...state,...result.state};
    if(result.request){const action=await runNativeEditorAction(host,state,result.request as 'horizon'|'new'|'load'|'save'|'done',dialogs);state={...state,...action.state};commit();if(action.exit)return;}
   }else if(key.command==='validate'){
    const a=host.routeResources,result=analyzeRoute(Array.from(encodeTrackFile(state)),a.records,a.metadataVectors,a.sampleVectors,a.objects,undefined,{sample:false}),error=result.route?.error??result.terrainError?.error??0;
    await dialogs.dialog(host.errorKeys[error],1,0,1);
    routeColumns=result.route?.columns??[];routeRows=result.route?.routeRows??[];
    const next=applyEditorValidationResult({cursor:state.cursor,mode:state.mode,selectedTile:state.selected,previousTile:state.savedPiece,selection:state.selection,dirty:state.change},error,result.location??state.cursor,routeColumns,routeRows,state.track);
    state={...state,cursor:next.cursor,mode:next.mode,selected:next.selectedTile,savedPiece:next.previousTile,selection:next.selection,change:next.dirty};
   }
   commit();break;
  }
 }
}
