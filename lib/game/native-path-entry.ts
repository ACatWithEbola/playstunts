import {editOriginalTextEntry} from './text-entry.ts';
import {drawOriginalTextEntry} from './text-entry-raster.ts';
export interface NativePathEntryHost {
 pixels:Uint8Array;font:Uint8Array;present():void;
 counters():{input:number;game:number};
 keyboard():Promise<{key:number;input:number;game:number}>;
}
/** Native path-field caller1b3f6: flags2,18-byte padded text,9*n+9
 * pixel clipping, keyboard-only input, four-game-tick cursor and fast-counter
 * inactivity timeout. Mouse activation is deliberately outside text editing.
 */
export function editNativePath(host:NativePathEntryHost,path:string,length:number,timeout:number,field:{x:number;y:number}){
 return interactNativePathEntry({...host,draw:(text,cursor,x,y,width,height,visible)=>drawOriginalTextEntry(host.pixels,host.font,text,cursor,x,y,width,height,visible)},path,length,timeout,field);
}
export interface NativePathInteractionHost extends Pick<NativePathEntryHost,'present'|'counters'|'keyboard'> {draw(text:string,cursor:number,x:number,y:number,width:number,height:number,visible:boolean):{text:string;cursor:number};}
export async function interactNativePathEntry(host:NativePathInteractionHost,path:string,length:number,timeout:number,field:{x:number;y:number}){
 let state={text:path.slice(0,length).padEnd(length,' '),cursor:0,first:true,insert:false},visible=true;
 let clocks=host.counters(),blink=(clocks.game+4)>>>0,expires=(clocks.input+timeout)>>>0;
 const draw=()=>{const next=host.draw(state.text,state.cursor,field.x,field.y,length*9+9,state.insert?8:1,visible);state={...state,...next};host.present();};
 draw();
 for(;;){
  const sample=await host.keyboard();clocks={input:sample.input>>>0,game:sample.game>>>0};
  if(sample.key){
   expires=(clocks.input+timeout)>>>0;
   const next=editOriginalTextEntry(state,sample.key,2);state=next;
   if(next.done){visible=false;draw();return {path:state.text.trimEnd(),key:sample.key};}
   draw();
  }else if((clocks.game>>>16)>=(blink>>>16)&&(clocks.game&65535)>=(blink&65535)){
   blink=(clocks.game+4)>>>0;visible=!visible;draw();
   if(timeout&&clocks.input>=expires){visible=false;draw();return {path:state.text.trimEnd(),key:0};}
  }
 }
}
