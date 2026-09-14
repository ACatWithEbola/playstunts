import {interactNativeFileDialog,type NativeFileDialogServices} from './native-file-dialog-interaction.ts';
import {drawOriginalFileDialogDisplay} from './file-dialog-display.ts';
import {drawOriginalDialogDisplay,type OriginalDialogDisplayHost} from './dialog-display.ts';
import {interactNativeOriginalDialog} from './native-dialog-interaction.ts';
import type {NativeMenuInput} from './native-dialog-runtime.ts';
export interface NativeDisplayDialogHost {
 memory():Uint8Array;d:number;mode:'cga'|'tandy'|'ega';drawing:OriginalDialogDisplayHost;
 resources:Record<string,ReadonlyArray<number>>;
 /** The display owner selects the visible window and retains its background.
  * The returned callback restores that background and the prior active window. */
 capture(retain:boolean):()=>void;
 /** Optional compositor for a dialog over an upgraded scene; null restores it. */
 presentDialog?(bounds:readonly number[]|null):void;
 present():void;input():Promise<NativeMenuInput>;release():Promise<void>;gameCounter():Promise<number>;
}
/** Source dialog drawing plus the same original interaction used by MCGA.
 * Scratch belongs to the caller's data segment and must avoid live resources. */
export function createNativeDisplayDialogRuntime(host:NativeDisplayDialogHost,scratch:number,files?:NativeFileDialogServices){
 return {async dialog(resource:string,mode:number,selected=0,border=4,disabled?:ReadonlyArray<number>){
  const bytes=host.resources[resource];if(!bytes)throw Error('Missing original dialog resource '+resource);
  const memory=host.memory(),d=host.d,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),font=v.getUint16(d+0x4dd2,true)*16;
  const restore=host.capture(mode===0||mode===3);
  return interactNativeOriginalDialog({font:memory.subarray(font,font+65536),input:()=>host.input(),release:()=>host.release(),gameCounter:()=>host.gameCounter(),draw(selection){
   const current=host.memory(),word=(at:number)=>current[d+at]|(current[d+at+1]<<8);
   const content=drawOriginalDialogDisplay(current,d,host.mode,host.drawing,bytes,selection,{text:word(0x4e8a),border,disabled:word(0x4ec0)},scratch,disabled,mode);if(host.presentDialog)host.presentDialog(content.layout.bounds);else host.present();
  },restore(){restore();if(host.presentDialog)host.presentDialog(null);else host.present();}},bytes,mode,selected,disabled);
 },async file(path:string,extension:string,title:string,onPathChange?:(path:string)=>void){
  if(!files)throw Error('Native display file selection requires file services');
  const restore=host.capture(false);
  try{return await interactNativeFileDialog({...files,input:()=>host.input(),draw(input){const result=drawOriginalFileDialogDisplay(host.memory(),host.d,host.mode,host.drawing,host.resources,{...input,title},scratch);if(host.presentDialog)host.presentDialog(result.layout.bounds);else host.present();return result;}},path,extension,onPathChange);}
  finally{restore();if(host.presentDialog)host.presentDialog(null);else host.present();}
 }};
}
