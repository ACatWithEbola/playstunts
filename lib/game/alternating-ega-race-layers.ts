import {drawOriginalRacePresentation} from './race-presentation-frame.ts';
import {drawOriginalCockpitBase} from './cockpit-base-frame.ts';
import {updateOriginalCockpitFrame} from './cockpit-frame.ts';
import {createOriginalCockpitDisplayHost} from './cockpit-display-host.ts';
import {drawOriginalViewCrashDisplay,drawOriginalWorldStatusDisplay} from './race-overlay-display.ts';
import {drawOriginalReplayBarDisplay} from './replay-bar-display.ts';
import {combineOriginalRectangles} from './combine-rectangles.ts';
import {COCKPIT_DISPLAY_LAYOUTS} from './cockpit-display-layout.ts';
import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import {selectOriginalEgaBackPage,showOriginalEgaDisplayPage,type OriginalEgaPageOperation} from './ega-display-page.ts';
import type {OriginalFullRedrawDisplayHost} from './full-redraw-display-race-layers.ts';

/** Original EGA13C17..13C2B selection and13D1A..13F05 presentation.
 * The world callback draws into the selected back page; the original final
 * swap exposes that page and retains independent cockpit caches for both. */
export function drawOriginalAlternatingEgaRaceLayers(memory:Uint8Array,d:number,drawing:OriginalFullRedrawDisplayHost,bp:number,drawWorld:()=>void,showPage:(program:Generator<OriginalEgaPageOperation,void,number>)=>void){
 const a=WORLD_DISPLAY_LAYOUTS.ega.address,u=(n:number)=>n&65535;
 if(!memory[d+a(0xaa46)])throw Error('Alternating EGA presentation requires its native page owner');
 if(memory[d+0x132]||memory[d+0x133])throw Error('Race presentation requires the mouse cursor to be hidden');
 selectOriginalEgaBackPage(memory,d);memory[d+a(0x897c)]=memory[d+a(0x8998)];
 const screens={selectBackBuffer(){memory[d+0x131]=0;},selectFrontBuffer(){memory[d+0x131]=1;},selectDirectScreen(){selectOriginalEgaBackPage(memory,d);}};
 const cockpit=createOriginalCockpitDisplayHost(()=>memory,d,'ega',drawing,screens);
 drawOriginalRacePresentation({...cockpit,
  cockpit(action,frame){if(action===1)drawOriginalCockpitBase(cockpit,d,COCKPIT_DISPLAY_LAYOUTS.ega);else updateOriginalCockpitFrame(cockpit,d,frame,COCKPIT_DISPLAY_LAYOUTS.ega);},
  replay(action,first,last){if(action===1)drawOriginalReplayBarDisplay(memory,d,'ega',{...drawing,...screens},first,last);},
  world(){drawWorld();drawOriginalViewCrashDisplay(memory,d,'ega',drawing,a(0x7fe6),u(bp-0x22));drawOriginalWorldStatusDisplay(memory,d,'ega',drawing,u(bp-0x22));},
  combineRectangles(first,second,destination){combineOriginalRectangles(memory,d,first,second,destination,a);},
  // OriginalBCD4 returns immediately when alternate screens are enabled.
  present(){},swapScreen(){showPage(showOriginalEgaDisplayPage(memory,d,true));},
 },d,bp,a);
}
