import {createNativeDialogRuntime,type NativeDialogHost} from './native-dialog-runtime.ts';
import {drawOriginalOptionsBackground} from './options-screen-raster.ts';
import {originalOptionsFlow} from './options-menu-flow.ts';
import {originalOptionAction,type OriginalOptionSettings} from './options-actions.ts';
export interface NativeOptionsHost extends NativeDialogHost {
 settings:OriginalOptionSettings;
 audio(operation:'pause-audio'|'resume-audio'|'toggle-music'|'toggle-sound'):Promise<number>;
 calibrateJoystick():Promise<void>;
 replayPath:string;
 loadReplay(selection:{path:string;name:string}):Promise<void>;
}
export interface NativeOptionsPresentation {
 dialogs:ReturnType<typeof createNativeDialogRuntime>;
 background():void;
 capture():{restore():void;close():void};
}
/** Connect the verified original options dispatcher and action lifecycles to
 * native dialogs and file selection. The embedding game handles final replay
 * entry or exit after this routine returns. */
export async function runNativeOptions(host:NativeOptionsHost,display?:NativeOptionsPresentation):Promise<'menu'|'replay'|'exit'>{
 const dialogs=display?.dialogs??createNativeDialogRuntime(host),flow=originalOptionsFlow(host.settings);
 if(display)display.background();else drawOriginalOptionsBackground(host.pixels,host.font,host.resources);host.present();
 let step=flow.next(),selection:{path:string;name:string}|undefined;
 while(!step.done){
  const request=step.value;let result=0;
  if(request.type==='options')result=await dialogs.dialog('emop',2,0,4);
  else if(request.type==='input-device')result=await dialogs.dialog('emid',2,request.selected,1);
  else if(request.type==='select-replay'){
   selection=await dialogs.file(host.replayPath,'.rpl',String.fromCharCode(...host.resources.erep).split('\0')[0],path=>{host.replayPath=path;});
   if(selection){host.replayPath=selection.path;result=1;}
  }else if(request.type==='load-replay'){
   if(!selection)throw Error('Original replay dispatch requires a selected file');
   await host.loadReplay(selection);
  }else{
   const name=request.type==='configure-input'?request.device:request.type;
   if(name==='joystick'){await host.calibrateJoystick();step=flow.next(0);continue;}
   const action=originalOptionAction(name,host.settings);let effect=action.next(),saved:Uint8Array|undefined,retained:ReturnType<NativeOptionsPresentation['capture']>|undefined;
   try{while(!effect.done){let reply=0;const value=effect.value;
    if(value.type==='save'){if(display){retained?.close();retained=display.capture();}else saved=host.pixels.slice();}
    else if(value.type==='restore'){if(retained){retained.restore();retained.close();retained=undefined;}else {if(!saved)throw Error('Original options restore requires a saved screen');host.pixels.set(saved);}host.present();}
    else if(value.type==='dialog')reply=await dialogs.dialog(value.resource,value.mode,value.selected,value.border);
    else if(value.type==='exit')return 'exit';
    else reply=await host.audio(value.type);
    effect=action.next(reply);
   }}finally{retained?.close();}
  }
  step=flow.next(result);
 }
 return step.value?'replay':'menu';
}
