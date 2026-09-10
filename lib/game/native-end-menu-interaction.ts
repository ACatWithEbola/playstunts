import {advanceOriginalEndMenu,type OriginalEndMenuState} from './end-menu-input.ts';
import {originalMenuSelectionFlash} from './menu-selection-flash.ts';
import type {NativeEndMenuHost} from './native-end-menu-runtime.ts';
import type {originalEndMenuButtons} from './end-menu-buttons.ts';
export interface NativeEndMenuPresentation {buttons:ReturnType<typeof originalEndMenuButtons>;restore():void;outline(selection:number,colour:number):void;close():void}
/** Shared original results button interaction, independent of display format. */
export async function interactNativeEndMenu(host:Pick<NativeEndMenuHost,'release'|'present'|'counter'|'animate'|'input'|'review'>&{draw(state:OriginalEndMenuState):NativeEndMenuPresentation},initial:Omit<OriginalEndMenuState,'selected'>){
 let state:OriginalEndMenuState={...initial,selected:1};
 for(;;){
  state.selected=1;const drawing=host.draw(state);
  try{
   await host.release();host.present();let last=host.counter(),phase=0,color=-1,drawn=1;
   for(;;){
    const now=host.counter(),delta=(now-last)&65535;last=now;
    if(drawn!==state.selected){drawing.restore();drawn=state.selected;phase=0;color=-1;}
    const flash=originalMenuSelectionFlash(phase,delta);phase=flash.counter;
    if(color!==flash.color){color=flash.color;drawing.outline(state.selected,color);host.present();}
    host.animate(delta);const input=await host.input();
    if(input.mouseActive){const hit=drawing.buttons.find(b=>input.x>=b.left&&input.x<=b.right&&input.y>=b.top&&input.y<=b.bottom);if(hit)state.selected=hit.selection;}
    const next=advanceOriginalEndMenu(state,input.key);state=next.state;
    if(next.action==='return')return next.result!;
    if(next.action==='review'){drawing.restore();drawing.close();state={...await host.review(state),selected:1};break;}
   }
  }finally{drawing.close();}
 }
}
