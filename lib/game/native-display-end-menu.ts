import {interactNativeEndMenu} from './native-end-menu-interaction.ts';
import {captureNativeDisplayRegion} from './native-display-region.ts';
import {drawOriginalEndMenuButtonsDisplay} from './end-menu-buttons-display.ts';
import {originalMainMenuDisplayColours} from './main-menu-display.ts';
import {restoreOriginalDisplayWindow} from './select-display-window.ts';
import type {createNativeDisplayCommonState} from './native-display-common-state.ts';
import type {NativeEndMenuHost} from './native-end-menu-runtime.ts';
import type {OriginalEndMenuState} from './end-menu-input.ts';
/** Results navigation uses the same original input and flashing lifecycle. */
export function runNativeDisplayEndMenu(owner:Awaited<ReturnType<typeof createNativeDisplayCommonState>>,host:Pick<NativeEndMenuHost,'resources'|'release'|'present'|'counter'|'animate'|'input'|'review'>,initial:Omit<OriginalEndMenuState,'selected'>,scratch:number){
 return interactNativeEndMenu({...host,draw(state){
  restoreOriginalDisplayWindow(owner.memory(),owner.d,owner.mode);
  const buttons=drawOriginalEndMenuButtonsDisplay(owner.memory(),owner.d,owner.drawing,host.resources,state,scratch),strip=captureNativeDisplayRegion(owner,{x:0,y:174,width:320,height:24});
  return {...strip,buttons,outline(selection,colour){const b=buttons.find(button=>button.selection===selection);if(!b)return;const colors=originalMainMenuDisplayColours(owner.memory(),owner.d),pattern=colour===14?colors.early:colors.late,draw=owner.drawing;restoreOriginalDisplayWindow(owner.memory(),owner.d,owner.mode);draw.rectangle(b.left,b.top,b.right-b.left+1,1,pattern);draw.rectangle(b.left,b.bottom,b.right-b.left+1,1,pattern);draw.rectangle(b.left,b.top,1,b.bottom-b.top+1,pattern);draw.rectangle(b.right,b.top,1,b.bottom-b.top+1,pattern);}};
 }},initial);
}
