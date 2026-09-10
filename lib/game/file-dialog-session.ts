import {originalFileDialogNames} from './file-dialog-list.ts';
import {originalFileDialogInput} from './file-dialog-input.ts';
export type OriginalFileDialogEffect=
 |{type:'enumerate';path:string;extension:string}
 |{type:'draw';path:string;names:ReadonlyArray<string>;selected:number;scroll:number}
 |{type:'input'}|{type:'edit-path';path:string;length:18;timeout:30000};
export type OriginalFileDialogReply={paths:ReadonlyArray<string>}|{key:number;hit:number;buttons:number}|{path:string;key:number}|undefined;
/** Supplied file selection orchestration. Host owns enumeration, saved dialog
 * background and text-entry timing; native list/input/raster modules implement
 * the original behavior. Paths are DOS-style virtual game paths, not OS access.
 */
export function* originalFileDialogSession(path:string,extension:string):Generator<OriginalFileDialogEffect,{path:string;name:string}|undefined,OriginalFileDialogReply>{
 for(;;){
  const result=yield {type:'enumerate',path,extension};
  if(!result||!('paths' in result))throw Error('Original file dialog requires an enumeration result');
  const names=originalFileDialogNames(result.paths);let selected=0,scroll=0,editPath=names.length===0;
  if(!editPath){
   yield {type:'draw',path,names,selected,scroll};
   for(;;){
    const input=yield {type:'input'};if(!input||!('hit' in input))throw Error('Original file dialog requires input');
    const next=originalFileDialogInput({...input,names,selected,scroll});
    if(next.action==='path'){editPath=true;break;}
    if(next.action==='cancel')return;
    if(next.action==='accept')return {path,name:names[next.selected]};
    if(next.selected!==selected||next.scroll!==scroll){selected=next.selected;scroll=next.scroll;yield {type:'draw',path,names,selected,scroll};}
   }
  }
  if(editPath){
   const entered=yield {type:'edit-path',path,length:18,timeout:30000};
   if(!entered||!('path' in entered))throw Error('Original file dialog requires edited path input');
   path=entered.path;if(entered.key===27)return;
  }
 }
}
