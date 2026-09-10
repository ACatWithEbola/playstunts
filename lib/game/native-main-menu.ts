import {createOriginalMainMenu,type MainMenuPresentation} from './main-menu-runtime.ts';
import type {NativeMenuInput} from './native-dialog-runtime.ts';
export interface NativeMainMenuHost extends MainMenuPresentation {
 counter():number;
 input():Promise<NativeMenuInput>;
}
/** Present and flash before waiting for input, matching 3795..3820. */
export async function runNativeMainMenuSelection(host:NativeMainMenuHost){
 const menu=createOriginalMainMenu(host);let time=host.counter();
 for(;;){
  const now=host.counter(),delta=(now-time)&65535;time=now;
  menu.frame(delta);
  const input=await host.input(),result=menu.accept({delta,key:input.key,x:input.x,y:input.y,mouseEnabled:input.mouseActive});
  if(result.result!==undefined)return {selection:result.result,idleExpired:result.state.idleExpired};
 }
}

/** Selection-only adapter for callers that do not enter a race. */
export async function runNativeMainMenu(host:NativeMainMenuHost){return (await runNativeMainMenuSelection(host)).selection;}
