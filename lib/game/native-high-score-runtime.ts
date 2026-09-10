import {originalHighScoreInsertion,originalHighScoreSaveBytes} from './high-score-insertion.ts';
import {prepareOriginalHighScoreRecord,nameOriginalHighScoreRecord} from './high-score-record.ts';
import {drawOriginalDialog} from './dialog-raster.ts';
import type {NativeDialogHost} from './native-dialog-runtime.ts';

export interface NativeHighScoreState {
 file:Uint8Array;order:number[];selected:number;name:string;
 /** Actual retained local record supplied by the race caller. */
 retainedRecord:ReadonlyArray<number>;
 /** Optional allocated caller performs its original prompt lookup stack writes. */
 prepareRetainedRecord?():void;
}
export interface NativeHighScoreHost extends Pick<NativeDialogHost,'pixels'|'font'|'present'|'release'|'editPath'> {
 drawTable(state:NativeHighScoreState):void;
 save(bytes:Uint8Array):Promise<void>;
}
/** Original41de..436b. The field exit key is deliberately ignored: Escape
 * and timeout still commit the edited name. The loaded physical records
 * retain their insertion layout after the ordered file is saved. */
export async function enterNativeHighScore(host:NativeHighScoreHost,state:NativeHighScoreState,candidate:Parameters<typeof prepareOriginalHighScoreRecord>[1],message:ReadonlyArray<number>,border:number){
 return enterNativeHighScoreWithPresentation({...host,async editName(name,message,border){
  const resultSurface=host.pixels.slice(),dialog=drawOriginalDialog(host.pixels,host.font,message,0,{text:15,border,disabled:1},undefined,3);
  if(dialog.fields.length<1)throw Error('Original high-score prompt requires a name field');
  host.present();await host.release();const edited=await host.editPath(name,16,30000,dialog.fields[0]);host.pixels.set(resultSurface);return edited.path;
 }},state,candidate,message,border);
}
export async function enterNativeHighScoreWithPresentation(host:Pick<NativeHighScoreHost,'drawTable'|'present'|'save'>&{editName(name:string,message:ReadonlyArray<number>,border:number):Promise<string>},state:NativeHighScoreState,candidate:Parameters<typeof prepareOriginalHighScoreRecord>[1],message:ReadonlyArray<number>,border:number){
 state.prepareRetainedRecord?.();
 const insertion=originalHighScoreInsertion(Array.from(state.file),candidate.time,state.order,state.selected);
 if(!insertion.qualifies){host.drawTable(state);return false;}
 state.order=insertion.order;state.selected=insertion.selected;
 let record=prepareOriginalHighScoreRecord(state.retainedRecord,candidate);
 state.retainedRecord=Array.from(record);state.file.set(record,312);host.drawTable(state);host.present();
 state.name=await host.editName(state.name,message,border);
 record=nameOriginalHighScoreRecord(Array.from(record),state.name);state.retainedRecord=Array.from(record);state.file.set(record,312);
 host.drawTable(state);host.present();
 await host.save(originalHighScoreSaveBytes(Array.from(state.file),state.order));
 host.drawTable(state);return true;
}
