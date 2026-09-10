import {createNativeDialogRuntime,type NativeDialogHost} from './native-dialog-runtime.ts';
import {drawOriginalTrackOverview} from './track-overview-raster.ts';
import {drawOriginalTrackMenuOverlay} from './track-menu-overlay.ts';
import {installOriginalMenuPanorama} from './menu-panorama.ts';
import {advanceOriginalTrackMenu} from './track-menu-input.ts';
import {originalMenuSelectionFlash} from './menu-selection-flash.ts';
export interface NativeMenuTrack {name:string;raw:number[];path:string}
export interface NativeTrackMenuHost extends NativeDialogHost {
 smallFont:Uint8Array;baseline:Uint8Array;groundModels:Record<string,ReadonlyArray<number>>;
 panoramas:ReadonlyArray<{resources:Record<string,ReadonlyArray<number>>}>;
 track:NativeMenuTrack;configuration:number[];counter():number;
 readScores(name:string,path:string):Promise<ReadonlyArray<number>|null>;
 loadTrack(selection:{path:string;name:string}):Promise<number[]>;
 editTrack(track:NativeMenuTrack):Promise<void>;
}
export interface NativeTrackMenuPresentation {
 draw(track:NativeMenuTrack,score:ReadonlyArray<number>|null):void|Promise<void>;
 capture():{restore():void;close():void};outline(selection:number,colour:number):void;
 file:ReturnType<typeof createNativeDialogRuntime>['file'];
}
export const originalTrackMenuBounds=Array.from({length:3},(_,i)=>({left:16+i*96,right:112+i*96,top:171,bottom:197}));
/** Source38ac..3d5b. Editor and file storage are native caller-owned services. */
export async function runNativeTrackMenu(host:NativeTrackMenuHost,editImmediately=false,display?:NativeTrackMenuPresentation){
 const dialogs=display??createNativeDialogRuntime(host);let rebuild=true,selected=0,previous=-1,phase=0,color=0,idle=0,expired=0,time=host.counter(),background=host.pixels.slice(),retained:ReturnType<NativeTrackMenuPresentation['capture']>|undefined;
 const edit=async()=>{await host.editTrack(host.track);host.configuration.splice(13,9,...Array.from({length:9},(_,i)=>host.track.name.charCodeAt(i)||0));};
 if(editImmediately)await edit();
 try{for(;;){
  if(rebuild){
   retained?.close();
   if(display){const scores=await host.readScores(host.track.name,host.track.path);await display.draw(host.track,scores?.slice(0,52)??null);retained=display.capture();}
   else {const landscape=host.track.raw[900],panorama=host.panoramas[landscape&7];if(!panorama)throw Error('Missing original landscape '+landscape);
   installOriginalMenuPanorama(host.baseline,0x2d1a0,landscape,panorama.resources);drawOriginalTrackOverview(host.pixels,host.baseline,host.track.raw,host.groundModels);
   const scores=await host.readScores(host.track.name,host.track.path);drawOriginalTrackMenuOverlay(host.pixels,host.font,host.smallFont,host.resources,host.track.name,scores?.slice(0,52)??null);}
   background=host.pixels.slice();selected=0;previous=-1;rebuild=false;
  }
  if(previous!==selected){if(retained)retained.restore();else host.pixels.set(background);host.present();previous=selected;phase=0;color=0;idle=0;time=host.counter();}
  const now=host.counter(),delta=(now-time)&65535;time=now;const flash=originalMenuSelectionFlash(phase,delta);phase=flash.counter;
  if(flash.color!==color){color=flash.color;if(display)display.outline(selected,color);else {const r=originalTrackMenuBounds[selected];for(let x=r.left;x<=r.right;x++){host.pixels[r.top*320+x]=color;host.pixels[r.bottom*320+x]=color;}for(let y=r.top;y<=r.bottom;y++){host.pixels[y*320+r.left]=color;host.pixels[y*320+r.right]=color;}}host.present();}
  idle=(idle+delta)&65535;if((idle<<16>>16)>6000){idle=0;expired=(expired+1)&255;}
  const input=await host.input(),hover=input.mouseActive?originalTrackMenuBounds.findIndex(r=>input.x>=r.left&&input.x<=r.right&&input.y>=r.top&&input.y<=r.bottom):-1,result=advanceOriginalTrackMenu(selected,input.key,hover,expired);selected=result.selected;
  if(result.action==='done')return;
  if(result.action==='load'){
   const selection=await dialogs.file(host.track.path,'.trk',String.fromCharCode(...host.resources.etrk).split('\0')[0],path=>{host.track.path=path;});
   if(selection){const raw=await host.loadTrack(selection);if(raw.length!==1802)throw Error('Original track requires1802 bytes');host.track.raw=raw;host.track.name=selection.name;host.track.path=selection.path;host.configuration.splice(13,9,...Array.from({length:9},(_,i)=>selection.name.charCodeAt(i)||0));rebuild=true;}
   else previous=-1;
  }else if(result.action==='edit'){await edit();rebuild=true;}
 }
 }finally{retained?.close();}
}
