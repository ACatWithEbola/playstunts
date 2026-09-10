import {originalEndMenuButtons} from './end-menu-buttons.ts';
import {drawOriginalMenuButtonDisplay,type OriginalMenuButtonDisplayHost} from './menu-button-display.ts';
import type {OriginalEndMenuState} from './end-menu-input.ts';
/** Original results buttons retain their original conditional spacing. */
export function drawOriginalEndMenuButtonsDisplay(memory:Uint8Array,d:number,host:OriginalMenuButtonDisplayHost,resources:Record<string,ReadonlyArray<number>>,state:Omit<OriginalEndMenuState,'selected'>,scratch:number){
 const word=(at:number)=>memory[d+at]|(memory[d+at+1]<<8),buttons=originalEndMenuButtons(state);
 for(const b of buttons)drawOriginalMenuButtonDisplay(memory,d,host,resources[b.resource],b.x,b.y,b.width,b.height,word(0x4eb4),word(0x4eb6),word(0x4eb8),0,scratch);
 return buttons;
}
