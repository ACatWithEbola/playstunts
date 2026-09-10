import {advanceOriginalOpponentMenu,type OriginalOpponentMenuState} from './opponent-menu-input.ts';
import {drawOriginalOpponentMenu,originalOpponentMenuBounds} from './opponent-menu-raster.ts';
import {originalMenuSelectionFlash} from './menu-selection-flash.ts';
import type {NativeMenuInput} from './native-dialog-runtime.ts';
export interface NativeOpponentHost {
 pixels:Uint8Array;font:Uint8Array;smallFont:Uint8Array;
 art:Record<string,ReadonlyArray<number>>;resources:Record<string,ReadonlyArray<number>>;descriptions:ReadonlyArray<ReadonlyArray<number>>;
 configuration:number[];
 present(mode:number):void;
 counter():number;
 input():Promise<NativeMenuInput>;
 selectCar(configuration:number[],opponent:number):Promise<void>;
}
export interface NativeOpponentPresentation {draw(opponent:number):void;capture():{restore():void;close():void};outline(selection:number,colour:number):void}
/** Async host for supplied 50aa..56a6. Car selection returns to the same
 * button; opponent changes rebuild the saved screen and reset flashing. */
export async function runNativeOpponentMenu(host:NativeOpponentHost,display?:NativeOpponentPresentation){
 let state:OriginalOpponentMenuState={selected:0,configuration:host.configuration.slice()},previousOpponent=-1,previousSelected=-1,phase=0,color=0,mode=-1,priorTime=host.counter(),background=host.pixels.slice(),retained:ReturnType<NativeOpponentPresentation['capture']>|undefined; 
 try{for(;;){
  const opponent=state.configuration[6];
  if(opponent!==previousOpponent){
   retained?.close();if(display)display.draw(opponent);else drawOriginalOpponentMenu(host.pixels,host.font,host.smallFont,host.art,host.resources,host.descriptions[opponent],opponent);
   if(display)retained=display.capture();else background=host.pixels.slice();previousOpponent=opponent;previousSelected=-1;
  }
  if(previousSelected!==state.selected){if(retained)retained.restore();else host.pixels.set(background);host.present(mode);mode=-2;previousSelected=state.selected;phase=0;color=0;priorTime=host.counter();}
  const now=host.counter(),flash=originalMenuSelectionFlash(phase,(now-priorTime)&65535);priorTime=now;phase=flash.counter;
  if(flash.color!==color){color=flash.color;if(display)display.outline(state.selected,color);else {const r=originalOpponentMenuBounds[state.selected];for(let x=r.left;x<=r.right;x++){host.pixels[r.top*320+x]=color;host.pixels[r.bottom*320+x]=color;}for(let y=r.top;y<=r.bottom;y++){host.pixels[y*320+r.left]=color;host.pixels[y*320+r.right]=color;}}host.present(0);}
  const input=await host.input(),hover=input.mouseActive?originalOpponentMenuBounds.findIndex(r=>input.x>=r.left&&input.x<=r.right&&input.y>=r.top&&input.y<=r.bottom):-1;
  const result=advanceOriginalOpponentMenu(state,input.key,hover);state=result.state;host.configuration.splice(0,24,...state.configuration);
  if(result.action==='done')return;
  if(result.action==='car'){await host.selectCar(host.configuration,opponent);state.configuration=host.configuration.slice();previousOpponent=-1;}
 }
 }finally{retained?.close();}
}
