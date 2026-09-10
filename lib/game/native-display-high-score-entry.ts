import {enterNativeHighScoreWithPresentation} from './native-high-score-runtime.ts';
import {drawOriginalDialogDisplay} from './dialog-display.ts';
import {captureNativeDisplayDialogBackground} from './native-display-dialog-background.ts';
import type {createNativeDisplayCommonState} from './native-display-common-state.ts';
import type {NativeHighScoreHost} from './native-high-score-runtime.ts';
/** Original score insertion retains Escape/timeout commits in every display. */
export function enterNativeDisplayHighScore(owner:Awaited<ReturnType<typeof createNativeDisplayCommonState>>,host:Omit<NativeHighScoreHost,'pixels'|'font'>,...args:Parameters<typeof enterNativeHighScoreWithPresentation> extends [unknown,...infer R]?R:never){
 return enterNativeHighScoreWithPresentation({...host,async editName(name,message,border){
  const restore=captureNativeDisplayDialogBackground(owner),m=owner.memory(),d=owner.d,word=(at:number)=>m[d+at]|(m[d+at+1]<<8);
  try{
   const dialog=drawOriginalDialogDisplay(m,d,owner.mode,owner.drawing,message,0,{text:word(0x4e8a),border:border===4?word(0x4ec2):border,disabled:word(0x4ec0)},0xe800,undefined,3);
   if(!dialog.fields.length)throw Error('Original high-score prompt requires a name field');host.present();await host.release();return (await host.editPath(name,16,30000,dialog.fields[0])).path;
  }finally{restore();}
 }},...args);
}
