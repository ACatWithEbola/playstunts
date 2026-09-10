import {interactNativeEndMenu} from './native-end-menu-interaction.ts';
import {type OriginalEndMenuState} from './end-menu-input.ts';
import {drawOriginalEndMenuButtons} from './end-menu-buttons.ts';
import type {NativeDialogHost} from './native-dialog-runtime.ts';
export interface NativeEndMenuHost extends Pick<NativeDialogHost,'pixels'|'font'|'resources'|'present'|'release'|'input'> {
 counter():number;
 animate(delta:number):void;
 /** Reconstruct the top panel and return its resulting original flags. */
 review(state:OriginalEndMenuState):Promise<Omit<OriginalEndMenuState,'selected'>>;
}
/** Original6738..6c0c button/input lifecycle. Every rebuilt button row starts
 * at View Replay. Escape is ignored; mouse hover precedes key activation. */
export async function runNativeEndMenu(host:NativeEndMenuHost,initial:Omit<OriginalEndMenuState,'selected'>){
 return interactNativeEndMenu({...host,draw(state){
  const buttons=drawOriginalEndMenuButtons(host.pixels,host.font,host.resources,state),strip=host.pixels.slice(174*320,198*320);
  return {buttons,restore(){host.pixels.set(strip,174*320);},close(){},outline(selection,color){const b=buttons.find(button=>button.selection===selection);if(!b)return;for(let x=b.left;x<=b.right;x++){host.pixels[b.top*320+x]=color;host.pixels[b.bottom*320+x]=color;}for(let y=b.top;y<=b.bottom;y++){host.pixels[y*320+b.left]=color;host.pixels[y*320+b.right]=color;}}};
 }},initial);
}
