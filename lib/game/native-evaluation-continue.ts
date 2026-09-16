import {drawOriginalMenuButton} from './menu-button-raster.ts';
import {originalMenuSelectionFlash} from './menu-selection-flash.ts';
import type {NativeDialogHost} from './native-dialog-runtime.ts';
export interface NativeEvaluationContinueHost extends Pick<NativeDialogHost,'pixels'|'font'|'resources'|'present'|'release'|'input'> {counter():number;animate(delta:number):void;onOutline?(delta:number,colour:number):void;drawing?:{button():void;outline(colour:number):void}}
/** Original6479..662b: Continue precedes name entry. Unlike the final result
 * menu, this wait accepts Escape as well as Enter/Space. */
export async function continueNativeEvaluation(host:NativeEvaluationContinueHost){
 if(host.drawing)host.drawing.button();else drawOriginalMenuButton(host.pixels,host.font,host.resources.ebct,129,175,70,21,15,8,7,0);host.present();await host.release();
 // 1BAAC clears flash/idle state, not the elapsed-clock sample at DS:4DCC.
 // The preceding release polls have consumed that sample. Start here so menu
 // uptime cannot become a portrait-animation catch-up burst on first entry.
 let last=host.counter(),phase=0,color=-1;
 for(;;){
  const now=host.counter(),delta=(now-last)&65535;last=now;
  const flash=originalMenuSelectionFlash(phase,delta);phase=flash.counter;
  if(color!==flash.color){color=flash.color;if(host.drawing)host.drawing.outline(color);else {for(let x=128;x<=199;x++){host.pixels[174*320+x]=color;host.pixels[197*320+x]=color;}for(let y=174;y<=197;y++){host.pixels[y*320+128]=color;host.pixels[y*320+199]=color;}}host.onOutline?.(delta,color);host.present();}
  host.animate(delta);
  const {key}=await host.input();if(key===13||key===32||key===27)return key;
 }
}
