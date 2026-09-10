import {advanceOriginalMenu,type OriginalMenuState} from './main-menu-input.ts';
import {originalMainMenuHit} from './main-menu-hit.ts';
import {originalMenuSelectionFlash} from './menu-selection-flash.ts';
export interface MainMenuInput {delta:number;key:number;mouseEnabled:boolean;x:number;y:number}
export interface MainMenuPresentation {
 selectionColours?:Readonly<{late:number;early:number}>;
 redraw(mode:number):void;
 selectScreen():void;
 outline(selection:number,color:number):void;
}
/** Supplied run_menu 3718..38ad: redraw on selection changes, flash before
 * polling input, then hover and keyboard handling. Return preserves -1.
 * Presentation callbacks keep original control flow independent of resolution.
 */
export function createOriginalMainMenu(presentation:MainMenuPresentation,idleCounter=0,idleExpired=0){
 let state:OriginalMenuState={selected:0,idleCounter,idleExpired};
 let previous=-1,mode=-1,phase=0,color=-1,closed=false;
 const frame=(delta:number)=>{
  if(closed)throw Error('Original main menu has already returned');
  if(previous!==state.selected){previous=state.selected;presentation.redraw(mode);mode=-2;presentation.selectScreen();phase=0;color=0;state.idleCounter=0;}
  const flash=originalMenuSelectionFlash(phase,delta,presentation.selectionColours);phase=flash.counter;
  if(flash.color!==color){color=flash.color;presentation.outline(state.selected,color);}
 };
 const accept=(input:MainMenuInput)=>{
  if(closed)throw Error('Original main menu has already returned');
  const result=advanceOriginalMenu(state,input.delta,input.key,originalMainMenuHit(input.x,input.y,input.mouseEnabled));
  state=result.state;if(result.result!==undefined)closed=true;
  return result;
 };
 return {
  frame,accept,
  step(input:MainMenuInput){frame(input.delta);return accept(input);},
  get state(){return {...state};},
 };
}
/** Actual caller 2c56..2c8b: Escape restarts the intro, not DOS exit. */
export function originalMainMenuDestination(result:number){
 switch(result){case -1:return 'intro';case 0:return 'drive';case 1:return 'car';case 2:return 'opponent';case 3:return 'track';case 4:return 'options';default:return 'menu';}
}
