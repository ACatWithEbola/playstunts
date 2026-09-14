import {drawOriginalDialog} from './dialog-raster.ts';
import {drawOriginalFont} from './font-raster.ts';
import type {NativeDialogHost} from './native-dialog-runtime.ts';
/** Supplied 1a976..1aa9b: eight-character filename first, then the18-character
 * directory when editing continues. Spaces in filenames become underscores,
 * including on cancellation; caller-owned strings retain edits on Escape. */
export async function editNativeSaveName(host:Pick<NativeDialogHost,'pixels'|'font'|'resources'|'present'|'presentDialog'|'editPath'>,state:{name:string;path:string},title:string){
 const saved=host.pixels.slice(),content=drawOriginalDialog(host.pixels,host.font,host.resources.esav,-1,{text:15,border:4,disabled:1},undefined,3),rows=Array.from({length:256},(_,i)=>(i*320)&65535);
 if(content.fields.length!==3)throw Error('Original Save dialog requires three fields');
 for(const [i,text] of [title,state.path,state.name].entries())drawOriginalFont(host.pixels,host.font,text,content.fields[i].x,content.fields[i].y,15,rows,0);
 if(host.presentDialog)host.presentDialog(content.layout.bounds);else host.present();
 try{
  return await interactNativeSaveName(host,state,content.fields);
 }finally{host.pixels.set(saved);if(host.presentDialog)host.presentDialog(null);else host.present();}
}

export async function interactNativeSaveName(host:Pick<NativeDialogHost,'editPath'>,state:{name:string;path:string},fields:ReadonlyArray<{x:number;y:number}>){
  for(;;){
   const name=await host.editPath(state.name,8,30000,fields[2]);state.name=name.path.replace(/ /g,'_');
   if(name.key===27)return null;
   if(name.key===13)return {name:state.name,path:state.path};
   const path=await host.editPath(state.path,18,30000,fields[1]);state.path=path.path;
   if(path.key===27)return null;
  }
}
