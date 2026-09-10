import {originalDialogContent} from './dialog-content.ts';
import {measureOriginalFont} from './font-raster.ts';
import {originalDialogSession} from './dialog-session.ts';
import {originalDialogDelay} from './dialog-delay.ts';
import type {NativeMenuInput} from './native-dialog-runtime.ts';
/** Shared original dialog interaction. The display owner supplies capture,
 * rasterization and restoration; input and timing never depend on the driver. */
export async function interactNativeOriginalDialog(host:{font:Uint8Array;input():Promise<NativeMenuInput>;release():Promise<void>;gameCounter():Promise<number>;draw(selected:number):void;restore():void},bytes:ReadonlyArray<number>,mode:number,selected:number,disabled?:ReadonlyArray<number>){
 const content=originalDialogContent(bytes,line=>measureOriginalFont(host.font,line),-1,-1,mode);
 const initials=content.choices.length===2?content.choices.map(choice=>{let index=choice.offset;while(bytes[index]===32)index++;const code=bytes[index];return code>=65&&code<=90?code+32:code;}) as [number,number]:undefined;
 const flow=originalDialogSession(content,mode,selected,disabled,initials);let step=flow.next();
 try{
  while(!step.done){
   const effect=step.value;
   if(effect.type==='draw'){host.draw(effect.selected);step=flow.next();}
   else if(effect.type==='release'){await host.release();step=flow.next();}
   else if(effect.type==='delay'){const delay=originalDialogDelay(effect.ticks);let wait=delay.next();while(!wait.done)wait=delay.next(await host.gameCounter());step=flow.next();}
   else{const input=await host.input(),hover=input.mouseActive?content.choices.findIndex(r=>input.x>=r.left&&input.x<=r.right&&input.y>=r.top&&input.y<=r.bottom):-1;step=flow.next({key:input.key,hover});}
  }
  return step.value;
 }finally{if(mode!==0&&mode!==3)host.restore();}
}
