import {interactNativeSaveName} from './native-save-name.ts';
import {drawOriginalDialogDisplay} from './dialog-display.ts';
import type {NativeDisplayDialogHost} from './native-display-dialog-runtime.ts';
import type {NativeDialogHost} from './native-dialog-runtime.ts';
/** Original save-name interaction using the selected driver's font and window. */
export async function editNativeDisplaySaveName(host:NativeDisplayDialogHost&Pick<NativeDialogHost,'editPath'>,state:{name:string;path:string},title:string,scratch:number){
 const restore=host.capture(false);
 try{
  const memory=host.memory(),d=host.d,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(d+at,true);
  const content=drawOriginalDialogDisplay(memory,d,host.mode,host.drawing,host.resources.esav,-1,{text:word(0x4e8a),border:word(0x4ec2),disabled:word(0x4ec0)},scratch,undefined,3);
  if(content.fields.length!==3)throw Error('Original Save dialog requires three fields');
  const font=word(0x4dd2)*16;v.setUint16(font,word(0x4e8a)&(host.mode==='cga'?3:15),true);v.setUint16(font+2,0,true);
  for(const [i,text] of [title,state.path,state.name].entries()){memory.set([...Array.from(text,c=>c.charCodeAt(0)),0],d+scratch);host.drawing.text(scratch,content.fields[i].x,content.fields[i].y,true);}
  if(host.presentDialog)host.presentDialog(content.layout.bounds);else host.present();return await interactNativeSaveName(host,state,content.fields);
 }finally{restore();if(host.presentDialog)host.presentDialog(null);else host.present();}
}
