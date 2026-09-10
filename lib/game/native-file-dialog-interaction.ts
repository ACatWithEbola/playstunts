import {originalFileDialogSession,type OriginalFileDialogReply} from './file-dialog-session.ts';
import type {NativeMenuInput} from './native-dialog-runtime.ts';
export interface NativeFileDialogPresentation {fields:ReadonlyArray<{x:number;y:number}>;hits:ReadonlyArray<{left:number;right:number;top:number;bottom:number}>;}
export interface NativeFileDialogServices {
 enumerate(path:string,extension:string):Promise<ReadonlyArray<string>>;
 editPath(path:string,length:number,timeout:number,field:{x:number;y:number}):Promise<{path:string;key:number}>;
}
/** Original file-list interaction shared by every display implementation. */
export async function interactNativeFileDialog(host:NativeFileDialogServices&{input():Promise<NativeMenuInput>;draw(input:{names:ReadonlyArray<string>;path:string;selected:number;scroll:number}):NativeFileDialogPresentation},path:string,extension:string,onPathChange?:(path:string)=>void){
 const flow=originalFileDialogSession(path,extension);let step=flow.next(),presentation:NativeFileDialogPresentation|undefined;
 while(!step.done){let reply:OriginalFileDialogReply;const effect=step.value;
  if(effect.type==='enumerate')reply={paths:await host.enumerate(effect.path,effect.extension)};
  else if(effect.type==='draw')presentation=host.draw(effect);
  else if(effect.type==='edit-path'){
   presentation??=host.draw({names:[],path:effect.path,selected:0,scroll:0});
   reply=await host.editPath(effect.path,effect.length,effect.timeout,presentation.fields[1]);onPathChange?.(reply.path);
  }else{const input=await host.input();reply={key:input.key,buttons:input.buttons,hit:input.mouseActive?presentation!.hits.findIndex(r=>input.x>=r.left&&input.x<=r.right&&input.y>=r.top&&input.y<=r.bottom):-1};}
  step=flow.next(reply);
 }
 return step.value;
}
