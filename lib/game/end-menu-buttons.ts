import {drawOriginalMenuButton} from './menu-button-raster.ts';
import type {OriginalEndMenuState} from './end-menu-input.ts';
export function originalEndMenuButtons(state:Omit<OriginalEndMenuState,'selected'>){
 const first=!!state.evaluationAvailable&&(state.evaluationStatus&255)!==255,shift=first?0:-36;
 return [state.showEvaluation?'ebev':'ebhi','ebrp',state.evaluationAvailable?'ebra':'ebdr','ebmm'].flatMap((resource,selection)=>!first&&selection===0?[]:[{selection,resource,x:5+selection*80+shift,y:175,width:70,height:21,left:4+selection*80+shift,right:75+selection*80+shift,top:174,bottom:197}]);
}
/** Original6738..68bc button drawing and hit-area construction. */
export function drawOriginalEndMenuButtons(pixels:Uint8Array,font:Uint8Array,resources:Record<string,ReadonlyArray<number>>,state:Omit<OriginalEndMenuState,'selected'>){
 const buttons=originalEndMenuButtons(state);for(const b of buttons)drawOriginalMenuButton(pixels,font,resources[b.resource],b.x,b.y,b.width,b.height,15,8,7,0);return buttons;
}
