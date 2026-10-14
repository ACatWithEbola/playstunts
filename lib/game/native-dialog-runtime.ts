import {interactNativeFileDialog} from './native-file-dialog-interaction.ts';
import {interactNativeOriginalDialog} from './native-dialog-interaction.ts';
import {drawOriginalDialog} from './dialog-raster.ts';
import {drawOriginalFileDialog} from './file-dialog-raster.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
import {markMs91GraphicsChoices} from './ms91-graphics-marks.ts';
export interface NativeMenuInput {key:number;x:number;y:number;mouseActive:boolean;buttons:number}
export interface NativeDialogHost {
 physicsEngine?:PhysicsEngineVersion;
 pixels:Uint8Array;font:Uint8Array;resources:Record<string,ReadonlyArray<number>>;
 present():void;
 /** Optional compositor for a dialog over an upgraded scene; null restores it. */
 presentDialog?(bounds:readonly number[]|null):void;
 input():Promise<NativeMenuInput>;
 release():Promise<void>;
 gameCounter():Promise<number>;
 enumerate(path:string,extension:string):Promise<ReadonlyArray<string>>;
 editPath(path:string,length:number,timeout:number,field:{x:number;y:number}):Promise<{path:string;key:number}>;
}
/** Async native presentation adapter. Original generators own behavior; the
 * browser supplies device samples, frame boundaries and its virtual file store.
 */
export function createNativeDialogRuntime(host:NativeDialogHost){
 const text=(resource:string)=>{const bytes=host.resources[resource];if(!bytes)throw Error('Missing original dialog resource '+resource);return bytes;};
 return {
  async dialog(resource:string,mode:number,selected=0,border=4,disabled?:ReadonlyArray<number>,marked?:readonly boolean[]){
   if(marked&&(host.physicsEngine!=='ms-1991'||resource!=='emrl'))throw Error('Setting marks require the MS91 graphics dialog');
   const source=text(resource),bytes=marked?markMs91GraphicsChoices(source,marked):source,saved=host.pixels.slice(),physicsEngine=host.physicsEngine;
   return interactNativeOriginalDialog({...host,draw(selection){const content=drawOriginalDialog(host.pixels,host.font,bytes,selection,{text:15,border,disabled:1},disabled,mode,{x:-1,y:-1},physicsEngine);if(host.presentDialog)host.presentDialog(content.layout.bounds);else host.present();},restore(){host.pixels.set(saved);if(host.presentDialog)host.presentDialog(null);else host.present();}},bytes,mode,selected,disabled,physicsEngine);
  },
  async file(path:string,extension:string,title:string,onPathChange?:(path:string)=>void){
   const saved=host.pixels.slice();
   try{return await interactNativeFileDialog({...host,draw(input){const result=drawOriginalFileDialog(host.pixels,host.font,host.resources,{...input,title});if(host.presentDialog)host.presentDialog(result.layout.bounds);else host.present();return result;}},path,extension,onPathChange);}
   finally{host.pixels.set(saved);if(host.presentDialog)host.presentDialog(null);else host.present();}
  },
 };
}
