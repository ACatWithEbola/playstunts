import {createNativeDialogRuntime,type NativeDialogHost} from './native-dialog-runtime.ts';
import {editorHorizonResult} from './editor-horizon.ts';
import {newEditorTerrain} from './editor-new-state.ts';
import {encodeTrackFile} from './track-file.ts';
import {loadEditorTrack,type EditorRouteResources} from './editor-load-track.ts';
export interface NativeEditorActionState {name:string;path:string;track:number[];terrain:number[];modified:number;revision:number;cursor:number[];mode:number}
export interface NativeEditorActionHost extends NativeDialogHost {
 routeResources:EditorRouteResources;presets:{terrain:number[]}[];
 saveName(state:NativeEditorActionState):Promise<{name:string;path:string}|null>;
 exists(path:string,name:string):Promise<boolean>;
 writeTrack(path:string,name:string,bytes:Uint8Array):Promise<number>;
 clearScores(path:string,name:string):Promise<void>;
 readTrack(path:string,name:string):Promise<Uint8Array>;
}
/** Supplied editor dialog/action branches. Save First returns to editing after
 * the save loop; it does not automatically resume Load or Done. */
export async function runNativeEditorAction(host:NativeEditorActionHost,before:NativeEditorActionState,action:'horizon'|'new'|'load'|'save'|'done',dialogs= createNativeDialogRuntime(host)){
 let state={...before,track:[...before.track],terrain:[...before.terrain],cursor:[...before.cursor]};
 const save=async()=>{
  for(;;){
   state.revision=(state.revision+1)&255;
   const selection=await host.saveName(state);if(!selection)return;
   state={...state,...selection};
   if(await host.exists(state.path,state.name)){
    const choice=await dialogs.dialog('efex',2,0,1);if(choice===-1||choice===65535)return;if(choice===0)continue;
   }
   const status=await host.writeTrack(state.path,state.name,encodeTrackFile(state));
   if(!status){await host.clearScores(state.path,state.name);state.modified=0;return;}
   await dialogs.dialog('eser',1,0,1);
  }
 };
 if(action==='horizon'){
  const result=editorHorizonResult(state.track[900],await dialogs.dialog('emss',2,state.track[900],4));
  if(result.changed){state.track[900]=result.horizon;state.revision=(state.revision+1)&255;state.modified=1;}
 }else if(action==='new')state={...state,...newEditorTerrain(state,await dialogs.dialog('emen',2,0,4),host.presets)};
 else if(action==='save')await save();
 else if(action==='done'){
  if(!state.modified)return {state,exit:true};
  if(await dialogs.dialog('echx',2,0,1)===0)await save();else return {state,exit:true};
 }else{
  if(state.modified&&await dialogs.dialog('echl',2,0,1)===0)await save();
  else{
   state.revision=(state.revision+1)&255;
   const selected=await dialogs.file(state.path,'.trk',String.fromCharCode(...host.resources.etrk).split('\0')[0],path=>{state.path=path;});
   if(selected){const loaded=loadEditorTrack(await host.readTrack(selected.path,selected.name),state.revision,host.routeResources);state={...state,...loaded,...selected};}
  }
 }
 return {state,exit:false};
}
